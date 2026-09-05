from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Response, status
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.config import Settings, get_settings

COOKIE_NAME = "pagatiempo_session"
SESSION_MAX_AGE = 60 * 60 * 12


def _serializer(settings: Settings) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(settings.secret_key, salt="pagatiempo-treasurer")


def create_session_cookie(response: Response, settings: Settings, role: str = "treasurer") -> None:
    token = _serializer(settings).dumps({"role": role})
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


def get_current_role(
    settings: Annotated[Settings, Depends(get_settings)],
    pagatiempo_session: Annotated[str | None, Cookie()] = None,
) -> str:
    if not pagatiempo_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión requerida")
    try:
        payload = _serializer(settings).loads(pagatiempo_session, max_age=SESSION_MAX_AGE)
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
