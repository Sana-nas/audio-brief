import os
import sys
import threading

from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        # When the development server starts, load the AI models in a background
        # thread so the first upload does not have to wait for them. (With the
        # auto-reloader Django starts two processes; only the serving one has
        # RUN_MAIN=true. Other commands - migrate, shell - never load models.)
        serving = 'runserver' in sys.argv and (
            os.environ.get('RUN_MAIN') == 'true' or '--noreload' in sys.argv)
        if serving:
            from .services import ai_models
            threading.Thread(target=ai_models.preload, name='model-preload', daemon=True).start()
