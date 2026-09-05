from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Response, status
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.config import Settings, get_settings

COOKIE_NAME = "pagatiempo_session"
SESSION_MAX_AGE = 60 * 60 * 12


def _serializer(settings: Settings) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(settings.secret_key, salt="pagatiempo-treasurer")


def create_session_cookie(response: Response, settings: Settings) -> None:
    token = _serializer(settings).dumps({"role": "treasurer"})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
        max_age=SESSION_MAX_AGE,
        path="/",
    )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        COOKIE_NAME,
        path="/",
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
    )


def require_treasurer(
    settings: Annotated[Settings, Depends(get_settings)],
    pagatiempo_session: Annotated[str | None, Cookie()] = None,
) -> None:
    if not pagatiempo_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión requerida")
    try:
        payload = _serializer(settings).loads(pagatiempo_session, max_age=SESSION_MAX_AGE)
    except (BadSignature, SignatureExpired) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida") from exc
    if payload.get("role") != "treasurer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida")
