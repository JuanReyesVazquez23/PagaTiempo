import pytest
from fastapi import HTTPException, Response

from app.auth import (
    COOKIE_NAME,
    HOST_COOKIE_NAME,
    _serializer,
    create_session_cookie,
    get_current_role,
    require_admin,
    require_treasurer,
    session_cookie_name,
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


def _secure_settings() -> Settings:
    return Settings(
        database_url="postgresql://user:pass@localhost:5432/db",
        treasurer_pin="2468",
        admin_key="secret-admin-pass",
        secret_key="test-secret-key-long-enough",
        cookie_secure=True,
    )


def test_cookie_name_uses_host_prefix_only_when_secure() -> None:
    assert session_cookie_name(_test_settings()) == COOKIE_NAME
    assert session_cookie_name(_secure_settings()) == HOST_COOKIE_NAME


def test_secure_cookie_is_httponly_and_host_prefixed() -> None:
    response = Response()
    create_session_cookie(response, _secure_settings(), role="admin")

    cookie = response.headers["set-cookie"]
    assert cookie.startswith(f"{HOST_COOKIE_NAME}=")
    assert "HttpOnly" in cookie
    assert "Secure" in cookie
    assert "Path=/" in cookie


def test_secure_session_reads_only_the_host_cookie() -> None:
    settings = _secure_settings()

    host_token = _serializer(settings).dumps({"role": "admin"})
    assert get_current_role(settings, host_pagatiempo_session=host_token) == "admin"

    # En modo Secure, la cookie antigua sin prefijo no debe autenticar.
    plain_token = _serializer(settings).dumps({"role": "treasurer"})
    with pytest.raises(HTTPException) as exc:
        get_current_role(settings, pagatiempo_session=plain_token)
    assert exc.value.status_code == 401
