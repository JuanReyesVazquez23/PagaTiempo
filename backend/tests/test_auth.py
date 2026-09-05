import pytest
from fastapi import HTTPException, Response

from app.auth import (
    _serializer,
    create_session_cookie,
    get_current_role,
    require_admin,
    require_treasurer,
)
from app.config import Settings


def _test_settings() -> Settings:
    return Settings(
        database_url="postgresql://user:pass@localhost:5432/db",
        treasurer_pin="2468",
        admin_key="secret-admin-pass",
        secret_key="test-secret-key-long-enough",
    )


def test_require_admin_allows_admin() -> None:
    assert require_admin("admin") == "admin"


def test_require_admin_rejects_treasurer() -> None:
    with pytest.raises(HTTPException) as exc_info:
        require_admin("treasurer")
    assert exc_info.value.status_code == 403


def test_require_treasurer_allows_both() -> None:
    assert require_treasurer("treasurer") == "treasurer"
    assert require_treasurer("admin") == "admin"


def test_session_cookie_roles() -> None:
    settings = _test_settings()

    # Treasurer token
    treasurer_token = _serializer(settings).dumps({"role": "treasurer"})
    assert get_current_role(settings, pagatiempo_session=treasurer_token) == "treasurer"

    # Admin token
    admin_token = _serializer(settings).dumps({"role": "admin"})
    assert get_current_role(settings, pagatiempo_session=admin_token) == "admin"


def test_missing_or_invalid_session_raises_401() -> None:
    settings = _test_settings()
    with pytest.raises(HTTPException) as exc:
        get_current_role(settings, pagatiempo_session=None)
    assert exc.value.status_code == 401

    with pytest.raises(HTTPException) as exc:
        get_current_role(settings, pagatiempo_session="tampered.cookie.value")
    assert exc.value.status_code == 401
