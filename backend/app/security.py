UNSAFE_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})
CSRF_HEADER = "x-requested-with"
CSRF_HEADER_VALUE = "XMLHttpRequest"


def requires_csrf_header(method: str, path: str) -> bool:
    """Only mutating API requests need the CSRF header."""
    return method.upper() in UNSAFE_METHODS and path.startswith("/api/")


def has_valid_csrf_header(headers: object) -> bool:
    """Browsers cannot set this header cross-site without a CORS preflight."""
    get = getattr(headers, "get", None)
    if get is None:
        return False
    return get(CSRF_HEADER) == CSRF_HEADER_VALUE
