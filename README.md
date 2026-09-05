# PagaTiempo

Libro de cuotas para tesorera. 10 meses desde el 4 de septiembre de 2026 (sep 2026–jun 2027). Estudiantes de ejemplo: Juan Pérez, María García, Pedro López.

## Stack

- React 19 + TypeScript (Vite)
- FastAPI
- PostgreSQL (`DATABASE_URL`; Neon u otro host Postgres)

## Arranque

```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
.venv\Scripts\uvicorn app.main:app --reload --app-dir .
```

```bash
cd frontend
npm install
npm run dev
```

PIN demo: `2468`. UI: `http://localhost:5173`.

Para Postgres en la nube, pega la URL en `backend/.env` (`postgresql://...`). Neon: añade `sslmode=require` si hace falta.

## Despliegue: frontend en Netlify, backend en Vercel

Es un repo con `frontend/` y `backend/` como carpetas hermanas, así que cada plataforma necesita apuntar a la suya:

**Backend en Vercel**
1. Nuevo proyecto → importa el repo → en **Root Directory** pon `backend`.
2. Vercel detecta FastAPI solo (usa `app/main.py` y `requirements.txt`, sin configuración extra).
3. Variables de entorno del proyecto (Vercel, no Netlify): `DATABASE_URL`, `TREASURER_PIN`, `SECRET_KEY`, `CORS_ORIGINS`, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none` — ver los comentarios en `backend/.env.example`.
4. Si usas Neon, copia el endpoint agrupado (el que trae `-pooler` en el host) como `DATABASE_URL`: el backend corre como funciones serverless y ese endpoint evita agotar las conexiones.

**Frontend en Netlify**
1. Nuevo sitio → importa el repo → en **Base directory** pon `frontend` (ahí vive `netlify.toml`, que ya trae el build command y el redirect de SPA).
2. Variable de entorno del sitio (Netlify, no Vercel): `VITE_API_BASE_URL` con la URL pública del backend en Vercel.

**Orden recomendado:** despliega primero el backend para tener su URL, ponla como `VITE_API_BASE_URL` en Netlify y despliega el frontend, y por último vuelve a Vercel y pon la URL final de Netlify en `CORS_ORIGINS` (puede pedir un redeploy del backend para que tome el cambio).

El PIN nunca debe ir en una variable `VITE_...` ni en Netlify: cualquier variable con ese prefijo queda visible en el navegador. Vive solo en `TREASURER_PIN`, en Vercel.
