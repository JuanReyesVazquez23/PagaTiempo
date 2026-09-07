import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Registrar el service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("SW registration failed:", err));
    }

    // Detectar si ya esta instalada como PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Detectar instalacion exitosa
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
  }

  // No mostrar si: ya instalada, no hay prompt disponible, o el usuario descarto
  if (isInstalled || !installPrompt || dismissed) return null;

  return (
    <div className="pwa-install-fab" role="complementary" aria-label="Instalar aplicacion">
      <button
        className="pwa-install-btn"
        onClick={handleInstall}
        title="Agregar PagaTiempo a la pantalla principal"
      >
        <span className="pwa-install-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4" />
            <path d="M8 12l4 4 4-4" />
            <path d="M4 18h16a2 2 0 0 0 2-2v-1" />
          </svg>
        </span>
        <span className="pwa-install-label">Instalar app</span>
      </button>
      <button
        className="pwa-install-dismiss"
        onClick={handleDismiss}
        title="Cerrar"
        aria-label="Cerrar sugerencia de instalacion"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
