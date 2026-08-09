from django.utils import translation


class ApiLanguageMiddleware:
    """Make Accept-Language authoritative for /api/ requests.

    Django's LocaleMiddleware resolves language in priority order: URL prefix,
    then session, then the django_language cookie, and only then the
    Accept-Language header. That's right for server-rendered pages, but wrong
    here: the React app owns the language (from its /ar/ or /en/ route) and
    states it explicitly on every API call. A stale cookie from an earlier
    visit would otherwise win, serving Arabic content on the English site.

    Must be listed after LocaleMiddleware so it can override its decision.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.startswith("/api/"):
            return self.get_response(request)

        header = request.headers.get("Accept-Language", "")
        requested = header.split(",")[0].split(";")[0].strip()
        if not requested:
            return self.get_response(request)

        try:
            language = translation.get_supported_language_variant(requested)
        except LookupError:
            # Unknown language — leave LocaleMiddleware's choice alone.
            return self.get_response(request)

        previous = translation.get_language()
        translation.activate(language)
        request.LANGUAGE_CODE = language
        try:
            return self.get_response(request)
        finally:
            # Restore, so this request can't leak its language into the
            # thread's next request.
            if previous:
                translation.activate(previous)
            else:
                translation.deactivate()
