# PagaTiempo

Libro de cuotas para tesorera. 7 meses desde el 1 de diciembre de 2026 (dic 2026–jun 2027), con junio prorrateado a 2 semanas. Cuota mensual de RD$800 y meta total de RD$5,200 por estudiante. Estudiantes de ejemplo: Juan Pérez, María García, Pedro López.

Al arrancar, el backend sincroniza las cuotas de los estudiantes existentes con este ciclo y conserva su historial de pagos.

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

## Despliegue: frontend y backend en Vercel (dos proyectos separados)

Es un repo con `frontend/` y `backend/` como carpetas hermanas. Cada uno se importa como un proyecto de Vercel **distinto** (mismo repositorio, distinto Root Directory).

**Proyecto 1: backend**
1. Nuevo proyecto → importa el repo → en **Root Directory** pon `backend`.
2. Vercel detecta FastAPI solo (usa `app/main.py` y `requirements.txt`, sin configuración extra).
3. Variables de entorno **de este proyecto**: `DATABASE_URL`, `TREASURER_PIN`, `ADMIN_KEY`, `SECRET_KEY`, `CORS_ORIGINS`, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`, `TRUST_PROXY_HEADERS=true` — ver los comentarios en `backend/.env.example`.
4. Si usas Neon, copia el endpoint agrupado (el que trae `-pooler` en el host) como `DATABASE_URL`: el backend corre como funciones serverless y ese endpoint evita agotar las conexiones.

**Proyecto 2: frontend**
1. Nuevo proyecto aparte → importa el mismo repo → en **Root Directory** pon `frontend`.
2. Vercel detecta Vite solo. `frontend/vercel.json` ya trae el proxy `/api/*` hacia el backend (evita CORS y el bloqueo de cookies "de terceros" en Safari/iOS) y el rewrite de SPA para que `/panel` no dé 404 al recargar.
3. Si el nombre de tu proyecto del backend no es `pagatiempobackend`, edita la URL dentro de `frontend/vercel.json` antes de desplegar.
4. Con el proxy activo **no hace falta** definir `VITE_API_BASE_URL` — déjala vacía.

**Orden recomendado:** despliega primero el backend para confirmar su URL (ajústala en `frontend/vercel.json` si hace falta) y luego el frontend. `CORS_ORIGINS` en el backend puedes dejarlo con la URL del frontend de todas formas, como respaldo por si algo llama a la API directo sin pasar por el proxy.

`frontend/netlify.toml` se queda en el repo por si en algún momento despliegas ahí — Vercel lo ignora, así que no interfiere.

## Seguridad

- **/panel protegido:** el frontend verifica la sesión contra la API antes de montar el panel (`RequireAuth`); abrir `/panel` directamente sin sesión redirige al login. Todos los endpoints de datos exigen además la cookie firmada en el backend.
- **Sesión:** cookie `HttpOnly` firmada; con `COOKIE_SECURE=true` se emite como `__Host-pagatiempo_session` (Secure, sin `Domain`). Expira a las 12 horas.
- **Anti-CSRF:** las peticiones `POST`/`PUT`/`PATCH`/`DELETE` a `/api/*` deben enviar `X-Requested-With: XMLHttpRequest`, lo que un sitio externo no puede hacer sin pasar por CORS.
- **Límite de intentos:** máximo 5 intentos de login por minuto e IP (persistente en PostgreSQL, con bloqueo para evitar carreras).
- **Cabeceras:** CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS y `no-store` en respuestas de la API, tanto en el backend como en `frontend/vercel.json` y `frontend/netlify.toml`.
- **PWA:** el service worker no cachea `/api/`, usa red-primero para navegaciones y se actualiza sin caché HTTP, para no servir una versión vieja del panel.

## Modos de Acceso: Tesorera y Administrador

- **Modo Tesorera:** Se accede con `TREASURER_PIN` (demo: `2468`). Diseñado para el día a día: consulta de saldos, desglose de los 7 meses y registro rápido de pagos.
- **Modo Administrador:** Se accede con `ADMIN_KEY` (variable configurada en Vercel). Habilita funciones de gestión avanzada:
  - **Agregar estudiantes:** Crea estudiantes nuevos y les genera automáticamente sus 7 cuotas correspondientes al ciclo.
  - **Eliminar estudiantes:** Elimina al estudiante y todo su historial de cuotas/pagos asociados de manera permanente.
  - **Limpiar cuentas:** Restablece las cuotas a 0.00 pagado y elimina los pagos registrados, ya sea para un estudiante individual o para todo el ciclo escolar.

Tanto el PIN (`TREASURER_PIN`) como la contraseña de administrador (`ADMIN_KEY`) y la clave de firmado (`SECRET_KEY`) se configuran únicamente en el proyecto del backend en Vercel, como variables de entorno privadas; nunca deben ir en variables `VITE_...` en el proyecto del frontend ni exponerse ahí. Se entra al modo administrador desde el enlace "Acceso de administrador" al pie de la pantalla de login (`/admin`).
