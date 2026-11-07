from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.students import router as students_router
from app.security import has_valid_csrf_header, requires_csrf_header
from app.seed import (
    create_search_index,
    ensure_extensions,
    ensure_rate_limit_table,
    seed_if_empty,
    sync_cycle_installments,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        ensure_extensions(db)
        ensure_rate_limit_table(db)
        Base.metadata.create_all(bind=engine)
        create_search_index(db)
        sync_cycle_installments(db, settings)
        seed_if_empty(db, settings)
    finally:
        db.close()
    yield


app = FastAPI(title="PagaTiempo", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Requested-With"],
)


@app.middleware("http")
async def csrf_protection(request: Request, call_next):
    if requires_csrf_header(request.method, request.url.path) and not has_valid_csrf_header(
        request.headers
    ):
        return JSONResponse(
            status_code=403,
            content={"detail": "Solicitud no autorizada"},
        )
    return await call_next(request)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
    response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
        )

    if settings.cookie_secure:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response


app.include_router(auth_router)
app.include_router(students_router)
app.include_router(admin_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
