from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers.auth import router as auth_router
from app.routers.students import router as students_router
from app.seed import create_search_index, ensure_extensions, seed_if_empty

settings = get_settings()
app = FastAPI(title="PagaTiempo", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


app.include_router(auth_router)
app.include_router(students_router)


@app.on_event("startup")
def on_startup() -> None:
    db = SessionLocal()
    try:
        ensure_extensions(db)
        Base.metadata.create_all(bind=engine)
        create_search_index(db)
        seed_if_empty(db, settings)
    finally:
        db.close()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
