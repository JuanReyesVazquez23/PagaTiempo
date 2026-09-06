import { FormEvent, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError, login, adminLogin } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [_clicks, set_Clicks] = useState(0);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleClick = () => {
      set_Clicks((c) => {
        if (c >= 9) {
          setShowAdminKey(true);
          return 0;
        }
        return c + 1;
      });
    };
    const brandBadge = document.querySelector(".brand-badge");
    if (brandBadge) {
      brandBadge.addEventListener("click", handleClick);
    }
    return () => {
      const brandBadge2 = document.querySelector(".brand-badge");
      if (brandBadge2) {
        brandBadge2.removeEventListener("click", handleClick);
      }
    };
  }, []);

  useEffect(() => {
    const installPWA = () => {
      if (!deferredPrompt || showInstallButton) return;
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", (event: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the mini-infobar
      event.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(event);
      // Show our install button
      setShowInstallButton(true);
    });

    // Hide the install button if user dismisses it with the X or "Cancel"
    window.addEventListener("appinstalled", () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });
  }, [deferredPrompt, showInstallButton]);

  // Check if already running in PWA mode
  const isPWA = window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const pin = String(data.get("pin") ?? "");
    const adminKey = String(data.get("adminKey") ?? "");
    setError(null);
    try {
      if (showAdminKey && adminKey) {
        await adminLogin(adminKey);
      } else if (pin) {
        await login(pin);
      }
      navigate("/panel");
    } catch (cause: unknown) {
      setError(
        cause instanceof ApiError ? cause.message : "Clave incorrecta"
      );
    }
  }

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      setDeferredPrompt(null);
      setShowInstallButton(false);
      // Update localStorage to remember user choice
      localStorage.setItem("pwaInstallAttempted", "true");
    }
  };

  const handleDismissClick = () => {
    setShowInstallButton(false);
    localStorage.setItem("pwaInstallDismissed", "true");
  };

  return (
    <main className="shell login-shell">
      <div className="login-wrapper">
        <header className="hero login-hero">
          <div className="login-brand-pill">
            <span className="brand-badge" aria-hidden="true">PT</span>
            <span className="eyebrow">
              {showAdminKey ? "Administrador" : "Tesorera"} · Ciclo 10 meses
            </span>
          </div>
          <h1>PagaTiempo</h1>
          <p className="login-tagline">
            Gestión ordenada de cuotas escolares. Registro ágil e historiales individuales por estudiante.
          </p>
        </header>

        <form className="panel login-card" onSubmit={onSubmit}>
          <div className="card-header">
            <div className="lock-icon" aria-hidden="true">🔐</div>
            <div>
              <h2 className="login-card-title">Acceso al Panel</h2>
              {showAdminKey
                ? (
                  <p className="hint">10 clics en el logo PT = Modo Administrador. Ingresa la clave ADMIN_KEY</p>
                )
                : (
                  <p className="hint">Ingresa tu PIN de seguridad para continuar</p>
                )}
            </div>
          </div>

          <div className="field">
            {showAdminKey ? (
              <>
                <label htmlFor="admin-key">Clave de Acceso</label>
                <input
                  id="admin-key"
                  name="adminKey"
                  type="password"
                  autoComplete="off"
                  minLength={4}
                  required
                  placeholder="••••••••"
                  className="neu-input pin-input"
                />
              </>
            ) : (
              <>
                <label htmlFor="pin">PIN de tesorera</label>
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  autoComplete="off"
                  minLength={4}
                  required
                  placeholder="••••"
                  className="neu-input pin-input"
                />
              </>
            )}
          </div>

          {error ? (
            <p className="alert" role="alert">
              <span aria-hidden="true">⚠️</span> {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary login-btn">
            {showAdminKey ? "Entrar como Administrador" : "Entrar al Libro de Cuotas"} →
          </button>
        </form>

        {isPWA ? null : (
          <div className="pwa-install">
            {showInstallButton ? (
              <button
                onClick={handleDismissClick}
                className="pwa-install-btn"
                aria-label="Cancelar instalación de PWA"
              >
                Cancelar
              </button>
            ) : (
              <button
                onClick={handleInstallClick}
                className="pwa-install-btn"
                aria-label="Agregar PagaTiempo a la pantalla principal"
              >
                Agregar a la pantalla principal
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
