import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import clear_session_cookie, create_session_cookie, get_current_role
from app.config import Settings, get_settings
from app.database import get_db
from app.models import Student
from app.rate_limit import is_rate_limited, reset as reset_rate_limit
from app.schemas import AdminLoginRequest, LoginRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/login")
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    client_key = _client_key(request)
    if is_rate_limited(client_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
        )
    if not secrets.compare_digest(body.pin, settings.treasurer_pin):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="PIN incorrecto")
    reset_rate_limit(client_key)
    create_session_cookie(response, settings, role="treasurer")
    return {"status": "ok", "role": "treasurer"}


@router.post("/admin-login")
def admin_login(
    body: AdminLoginRequest,
    request: Request,
    response: Response,
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    client_key = _client_key(request)
    if is_rate_limited(client_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
        )
    if not settings.admin_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="El modo administrador no está configurado en el servidor (falta la variable ADMIN_PASSWORD)",
        )
    if not secrets.compare_digest(body.password, settings.admin_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña de administrador incorrecta",
        )
    reset_rate_limit(client_key)
    create_session_cookie(response, settings, role="admin")
    return {"status": "ok", "role": "admin"}


@router.post("/downgrade")
def downgrade(
    response: Response,
    settings: Settings = Depends(get_settings),
    _: str = Depends(get_current_role),
) -> dict[str, str]:
    create_session_cookie(response, settings, role="treasurer")
    return {"status": "ok", "role": "treasurer"}


@router.post("/logout")
def logout(response: Response, settings: Settings = Depends(get_settings)) -> dict[str, str]:
    clear_session_cookie(response, settings)
    return {"status": "ok"}


@router.get("/me")
def me(role: str = Depends(get_current_role), db: Session = Depends(get_db)) -> dict[str, str | int]:
    count = db.scalar(func.count(Student.id)) or 0
    return {"role": role, "student_count": count}
