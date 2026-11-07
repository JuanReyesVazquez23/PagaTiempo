from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Response, status
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.config import Settings, get_settings

COOKIE_NAME = "pagatiempo_session"
HOST_COOKIE_NAME = f"__Host-{COOKIE_NAME}"
SESSION_MAX_AGE = 60 * 60 * 12


def session_cookie_name(settings: Settings) -> str:
    """Use the __Host- prefix whenever the cookie can be Secure."""
    return HOST_COOKIE_NAME if settings.cookie_secure else COOKIE_NAME


def _serializer(settings: Settings) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(settings.secret_key, salt="pagatiempo-treasurer")


def create_session_cookie(response: Response, settings: Settings, role: str = "treasurer") -> None:
    token = _serializer(settings).dumps({"role": role})
    response.set_cookie(
        key=session_cookie_name(settings),
        value=token,
        httponly=True,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
        max_age=SESSION_MAX_AGE,
        path="/",
    )
    # Remove the old cookie name after enabling Secure in production.
    if settings.cookie_secure:
        response.delete_cookie(
            COOKIE_NAME,
            path="/",
            samesite=settings.cookie_samesite,
            secure=settings.cookie_secure,
        )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        COOKIE_NAME,
        path="/",
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
    )
    response.delete_cookie(
        HOST_COOKIE_NAME,
        path="/",
        samesite=settings.cookie_samesite,
        secure=True,
    )


def get_current_role(
    settings: Annotated[Settings, Depends(get_settings)],
    pagatiempo_session: Annotated[str | None, Cookie(alias=COOKIE_NAME)] = None,
    host_pagatiempo_session: Annotated[str | None, Cookie(alias=HOST_COOKIE_NAME)] = None,
) -> str:
    token = host_pagatiempo_session if settings.cookie_secure else pagatiempo_session
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión requerida")
    try:
        payload = _serializer(settings).loads(token, max_age=SESSION_MAX_AGE)
    except (BadSignature, SignatureExpired) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida") from exc
    role = payload.get("role")
    if role not in ("treasurer", "admin"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida")
    return role


def require_treasurer(
    role: Annotated[str, Depends(get_current_role)],
) -> str:
    return role


def require_admin(
    role: Annotated[str, Depends(get_current_role)],
) -> str:
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requiere permisos de administrador",
        )
    return role
