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
3. Variables de entorno del proyecto (Vercel, no Netlify): `DATABASE_URL`, `TREASURER_PIN`, `ADMIN_KEY`, `SECRET_KEY`, `CORS_ORIGINS`, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none` — ver los comentarios en `backend/.env.example`.
4. Si usas Neon, copia el endpoint agrupado (el que trae `-pooler` en el host) como `DATABASE_URL`: el backend corre como funciones serverless y ese endpoint evita agotar las conexiones.

**Frontend en Netlify**
1. Nuevo sitio → importa el repo → en **Base directory** pon `frontend` (ahí vive `netlify.toml`, que ya trae el build command y el redirect de SPA).
2. En `frontend/netlify.toml`, reemplaza la URL de ejemplo del bloque `[[redirects]] from = "/api/*"` por la URL real de tu backend en Vercel. Este proxy es lo que hace que el login funcione también en Safari/iOS (ver el comentario de ese archivo).
3. Deja `VITE_API_BASE_URL` vacía (o sin definir) en las variables de entorno del sitio en Netlify — con el proxy de arriba activo, definirla rompe el login en Safari/iOS.

**Orden recomendado:** despliega primero el backend para tener su URL, ponla en el `[[redirects]]` de `frontend/netlify.toml` y despliega el frontend, y por último vuelve a Vercel y pon la URL final de Netlify en `CORS_ORIGINS` (puede pedir un redeploy del backend para que tome el cambio).

## Modos de Acceso: Tesorera y Administrador

- **Modo Tesorera:** Se accede con `TREASURER_PIN` (demo: `2468`). Diseñado para el día a día: consulta de saldos, desglose de los 10 meses y registro rápido de pagos.
- **Modo Administrador:** Se accede con `ADMIN_KEY` (variable configurada en Vercel). Habilita funciones de gestión avanzada:
  - **Agregar estudiantes:** Crea estudiantes nuevos y les genera automáticamente sus 10 cuotas correspondientes al ciclo.
  - **Eliminar estudiantes:** Elimina al estudiante y todo su historial de cuotas/pagos asociados de manera permanente.
  - **Limpiar cuentas:** Restablece las cuotas a 0.00 pagado y elimina los pagos registrados, ya sea para un estudiante individual o para todo el ciclo escolar.

Tanto el PIN (`TREASURER_PIN`) como la contraseña de administrador (`ADMIN_KEY`) y la clave de firmado (`SECRET_KEY`) se configuran únicamente en Vercel como variables de entorno privadas; nunca deben ir en variables `VITE_...` en Netlify ni exponerse en el frontend.
