import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import clear_session_cookie, create_session_cookie, require_treasurer
from app.config import Settings, get_settings
from app.database import get_db
from app.models import Student
from app.rate_limit import is_rate_limited, reset as reset_rate_limit
from app.schemas import LoginRequest

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
    create_session_cookie(response, settings)
    return {"status": "ok"}


@router.post("/logout")
def logout(response: Response, settings: Settings = Depends(get_settings)) -> dict[str, str]:
    clear_session_cookie(response, settings)
    return {"status": "ok"}


@router.get("/me")
def me(_: None = Depends(require_treasurer), db: Session = Depends(get_db)) -> dict[str, str | int]:
    count = db.scalar(func.count(Student.id)) or 0
    return {"role": "treasurer", "student_count": count}
