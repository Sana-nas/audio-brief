"""HTTP views. The heavy lifting lives in ``core/services``."""
import logging
import os

from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_POST

from .auth import login_required
from .services import jobs
from .services.audio import SUPPORTED_FORMATS
from .services.pdf import build_pdf, pdf_filename

logger = logging.getLogger(__name__)

MAX_UPLOAD_MB = 100


# --------------------------------------------------------------------- pages
def landing(request):
    """Public landing page (logged-in users go straight to the home page)."""
    if request.user.is_authenticated:
        return redirect('home')
    return render(request, 'core/landing.html')


@login_required
def home(request):
    return render(request, 'core/home.html')


@never_cache
@login_required
def youtube(request):
    """YouTube summarization is a planned feature: this page is only a preview."""
    return render(request, 'core/youtube.html')


# ---------------------------------------------------------------------- auth
def register(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        # Direct password mismatch check
        password1 = request.POST.get('password1', '')
        password2 = request.POST.get('password2', '')

        if password1 and password2 and password1 != password2:
            messages.error(request, "The two password fields didn't match.")
            return render(request, 'core/register.html')

        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  # Auto-login after registration
            messages.success(request, 'Registration successful!')
            return redirect('home')
        else:
            # Pick a friendly message for the most common problems
            error_message = "Registration failed."

            if 'username' in form.errors:
                if 'exists' in str(form.errors['username']).lower():
                    error_message = "This username is already taken. Please choose another one."
                elif 'required' in str(form.errors['username']).lower():
                    error_message = "Username is required."
                else:
                    error_message = str(form.errors['username'][0])
            elif 'password2' in form.errors:
                if 'match' in str(form.errors['password2']).lower():
                    error_message = "The two password fields didn't match."
                elif 'common' in str(form.errors['password2']).lower():
                    error_message = "This password is too common. Please choose a stronger password."
                elif 'short' in str(form.errors['password2']).lower():
                    error_message = "This password is too short. It must contain at least 8 characters."
                elif 'numeric' in str(form.errors['password2']).lower():
                    error_message = "This password is entirely numeric. It must contain letters too."
                else:
                    error_message = str(form.errors['password2'][0])

            logger.warning(f"Registration error: {error_message}")
            messages.error(request, error_message)

    return render(request, 'core/register.html')


def user_login(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            messages.success(request, 'Logged in successfully!')
            return redirect('home')
        else:
            logger.warning(f"Login failed. Errors: {form.errors}")

            # Provide specific error messages based on the error type
            error_message = "Invalid username or password."

            # Check if the username exists but password is wrong
            username = form.data.get('username', '')
            if username:
                from django.contrib.auth.models import User
                if User.objects.filter(username=username).exists():
                    error_message = "The password you entered is incorrect. Please try again."
                else:
                    error_message = f"The username '{username}' doesn't exist. Please check your spelling or register a new account."

            # Check for inactive account
            if 'inactive' in str(form.errors).lower():
                error_message = "This account is inactive. Please contact the administrator."

            messages.error(request, error_message)
    else:
        form = AuthenticationForm()
    return render(request, 'core/login.html', {'form': form})


def user_logout(request):
    logout(request)
    messages.success(request, 'Logged out!')
    return redirect('login')


# ------------------------------------------------------ transcription + jobs
def _wants_json(request):
    return request.headers.get('X-Requested-With') == 'XMLHttpRequest'


def _upload_error(request, message, status=400, extra=None):
    """Report a problem with the upload, as JSON for the page's JavaScript or as a normal message."""
    if _wants_json(request):
        return JsonResponse({'error': message, **(extra or {})}, status=status)
    messages.error(request, message)
    return render(request, 'core/transcribe.html', {'max_upload_mb': MAX_UPLOAD_MB})


def _format_duration(seconds):
    seconds = int(round(seconds))
    return f"{seconds // 60}:{seconds % 60:02d}"


@never_cache
@login_required
def transcribe(request):
    """GET: the upload page.  POST: validate the file, queue a job, go to the job page."""
    if request.method != 'POST':
        return render(request, 'core/transcribe.html', {'max_upload_mb': MAX_UPLOAD_MB})

    audio_file = request.FILES.get('audio')
    if not audio_file:
        return _upload_error(request, "Please choose an audio file.")

    extension = os.path.splitext(audio_file.name)[1].lower()
    if extension not in SUPPORTED_FORMATS:
        return _upload_error(
            request,
            f"Unsupported file format. Please upload one of these formats: {', '.join(SUPPORTED_FORMATS)}")
    if audio_file.size == 0:
        return _upload_error(request, "Invalid audio file.")
    if audio_file.size > MAX_UPLOAD_MB * 1024 * 1024:
        return _upload_error(request, f"The file is too large. The limit is {MAX_UPLOAD_MB} MB.", status=413)

    running = jobs.manager.active_job_for(request.user.id)
    if running:
        job_url = reverse('job', args=[running.id])
        message = "You already have a file being processed. Please wait for it to finish (or cancel it)."
        if _wants_json(request):
            return JsonResponse({'error': message, 'job_url': job_url}, status=409)
        messages.info(request, message)
        return redirect(job_url)

    job = jobs.manager.submit(request.user.id, audio_file.name, jobs.save_upload(audio_file))
    job_url = reverse('job', args=[job.id])
    if _wants_json(request):
        return JsonResponse({'job_id': job.id, 'job_url': job_url}, status=202)
    return redirect(job_url)


@never_cache
@login_required
def job_page(request, job_id):
    """Shows the live progress of a job, or its result / error once it has finished."""
    job = jobs.manager.get(job_id, request.user.id)
    if job is None:
        messages.error(request, "That job was not found. It may have expired - please upload the file again.")
        return redirect('transcribe')

    context = {'job': job, 'status': jobs.manager.status(job), 'audio_filename': job.filename}
    if job.state == 'done':
        context.update({
            'transcription': job.transcription,
            'summary': job.summary,
            'stats': {
                'audio_length': _format_duration(job.audio_duration),
                'words': len(job.transcription.split()),
                'summary_words': len(job.summary.split()),
                'processing_time': _format_duration(job.finished_at - job.started_at),
            },
        })
    return render(request, 'core/transcribe.html', context)


@never_cache
@login_required
def job_status(request, job_id):
    """JSON polled by the progress page every second."""
    job = jobs.manager.get(job_id, request.user.id)
    if job is None:
        return JsonResponse({'state': 'missing', 'finished': True, 'error': 'Job not found.'}, status=404)
    return JsonResponse(jobs.manager.status(job))


@require_POST
@login_required
def job_cancel(request, job_id):
    job = jobs.manager.get(job_id, request.user.id)
    if job is None:
        return JsonResponse({'state': 'missing', 'finished': True}, status=404)
    jobs.manager.cancel(job)
    return JsonResponse(jobs.manager.status(job))


@login_required
def download_as_pdf(request):
    if request.method == 'POST':
        audio_filename = request.POST.get('audio_filename', 'Audio File')
        pdf_bytes = build_pdf(
            audio_filename,
            request.POST.get('transcription', ''),
            request.POST.get('summary', ''))
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{pdf_filename(audio_filename)}"'
        return response
    return redirect('transcribe')
