/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL completa del backend en Vercel (p. ej. https://pagatiempo-api.vercel.app).
   *  Déjala sin definir cuando frontend y backend comparten dominio. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
