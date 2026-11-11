import os

from django import template
from django.contrib.staticfiles import finders
from django.templatetags.static import static

register = template.Library()


@register.simple_tag
def static_v(path):
    """Like ``{% static %}`` but adds the file's last-modified time: ``app.css?v=1731340000``.

    Browsers cache CSS/JS files aggressively. Without this, after the file changes
    a user can keep seeing the old file (an unstyled or broken page). With it, the URL
    changes whenever the file changes, so the browser always fetches the new version.
    """
    url = static(path)
    found = finders.find(path)
    if found and os.path.isfile(found):
        return f"{url}?v={int(os.path.getmtime(found))}"
    return url
