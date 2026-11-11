from django.shortcuts import redirect
from django.contrib import messages
from functools import wraps


def login_required(function):
    """View decorator: send anonymous users to the login page."""
    @wraps(function)
    def wrap(request, *args, **kwargs):
        if request.user.is_authenticated:
            return function(request, *args, **kwargs)
        messages.error(request, "Please log in to access this page.")
        return redirect('login')
    return wrap


# URL names that do not require authentication (used by core.middleware as well)
PUBLIC_URLS = [
    'landing',
    'login',
    'register',
]
