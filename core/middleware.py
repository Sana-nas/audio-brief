from django.shortcuts import redirect
from django.contrib import messages
from django.urls import resolve, reverse
import logging
from .auth import PUBLIC_URLS

logger = logging.getLogger(__name__)

class AuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Get the current URL's name
        try:
            current_url_name = resolve(request.path_info).url_name
            logger.debug(f"Current URL name: {current_url_name}")
        except:
            current_url_name = None
            logger.debug(f"Could not resolve URL name for: {request.path_info}")

        # Check if the user is authenticated or accessing a public URL
        if (
            current_url_name in PUBLIC_URLS or 
            request.user.is_authenticated or
            request.path.startswith('/admin/') or
            request.path.startswith('/static/')
        ):
            # Allow access to public URLs or authenticated users
            return self.get_response(request)
        else:
            # Redirect unauthenticated users to the login page
            messages.error(request, "Please log in to access this page.")
            return redirect('login') 