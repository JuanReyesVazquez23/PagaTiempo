import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";
const INSTALLED_KEY = "pwa-install-completed";

function isRunningStandalone(): boolean {
  // Modo standalone PWA (ya instalada)
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari "Add to Home Screen"
  if ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone) return true;
  return false;
}

function wasInstalledBefore(): boolean {
  // Respaldo persistente: si en una visita anterior confirmamos la
  // instalación (evento appinstalled o "accepted" del prompt), lo
  // recordamos aquí. display-mode/standalone no siempre es confiable en
  // todos los navegadores/dispositivos apenas se reabre la pestaña normal
  // (por ejemplo, si el usuario entra por un enlace en vez de abrir el
  // ícono ya instalado), así que este flag evita que el botón reaparezca.
  return localStorage.getItem(INSTALLED_KEY) === "1";
}

export function PWAInstallButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(
    () => isRunningStandalone() || wasInstalledBefore()
  );
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISSED_KEY) === "1"
  );

  useEffect(() => {
    // Registrar Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("[PWA] SW registration failed:", err));
    }

    // Si ya es standalone, no hacer nada mas
    if (isRunningStandalone()) {
      setIsInstalled(true);
      localStorage.setItem(INSTALLED_KEY, "1");
      return;
    }

    // Escuchar cambio de display-mode (si se instala desde otra ventana)
    const mq = window.matchMedia("(display-mode: standalone)");
    const onMqChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        localStorage.setItem(INSTALLED_KEY, "1");
      }
    };
    mq.addEventListener("change", onMqChange);

    // Capturar el prompt de instalacion del navegador
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Detectar que la instalacion se completó
    const onAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      localStorage.setItem(INSTALLED_KEY, "1");
    };
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      mq.removeEventListener("change", onMqChange);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstalled(true);
      localStorage.setItem(INSTALLED_KEY, "1");
    }
  }

  function handleDismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  // No mostrar si: ya instalada (standalone), no hay prompt, o usuario cerró
  if (isInstalled || !installPrompt || dismissed) return null;

  return (
    <div className="pwa-install-fab" role="complementary" aria-label="Instalar aplicacion">
      <button
        className="pwa-install-btn"
        onClick={handleInstall}
        title="Agregar PagaTiempo a la pantalla principal"
      >
        <span className="pwa-install-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </span>
        <span className="pwa-install-label">Agregar a inicio</span>
      </button>
      <button
        className="pwa-install-dismiss"
        onClick={handleDismiss}
        title="Cerrar"
        aria-label="Cerrar sugerencia de instalacion"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
