import pytest
from pydantic import ValidationError

from app.security import has_valid_csrf_header, requires_csrf_header


@pytest.mark.parametrize("method", ["POST", "post", "PUT", "PATCH", "DELETE"])
def test_mutating_api_requests_require_csrf(method: str) -> None:
    assert requires_csrf_header(method, "/api/students") is True


@pytest.mark.parametrize("method", ["GET", "HEAD", "OPTIONS"])
def test_safe_methods_do_not_require_csrf(method: str) -> None:
    assert requires_csrf_header(method, "/api/students") is False


def test_non_api_routes_do_not_require_csrf() -> None:
    assert requires_csrf_header("POST", "/health") is False


def test_valid_csrf_header() -> None:
    assert has_valid_csrf_header({"x-requested-with": "XMLHttpRequest"}) is True


def test_missing_or_wrong_csrf_header() -> None:
    assert has_valid_csrf_header({}) is False
    assert has_valid_csrf_header({"x-requested-with": "fetch"}) is False


class _Headers:
    """Starlette Headers es insensible a mayúsculas; lo imitamos aquí."""

    def __init__(self, values: dict[str, str]) -> None:
        self._values = {key.lower(): value for key, value in values.items()}

    def get(self, key: str, default: str | None = None) -> str | None:
        return self._values.get(key.lower(), default)


def test_csrf_header_is_case_insensitive() -> None:
    assert has_valid_csrf_header(_Headers({"X-Requested-With": "XMLHttpRequest"})) is True


def test_cors_wildcard_is_rejected_with_cookies() -> None:
    from app.config import Settings

    with pytest.raises(ValidationError):
        Settings(
            database_url="postgresql://user:pass@localhost:5432/db",
            treasurer_pin="2468",
            secret_key="test-secret-key-long-enough",
            cors_origins="https://example.com,*",
        )
