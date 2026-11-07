import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { AdminLoginPage } from "./pages/AdminLoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { RequireAuth } from "./components/RequireAuth";
import { AUTH_EXPIRED_EVENT } from "./lib/api";

export function App() {
  const navigate = useNavigate();

  // Si la sesión expira mientras se usa el panel (por ejemplo, 12 h
  // después o si el backend invalida la cookie), cualquier llamada a la
  // API dispara este evento y volvemos al login.
  useEffect(() => {
    function onAuthExpired(): void {
      navigate("/", { replace: true });
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
  }, [navigate]);

  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route
          path="/panel"
          element={
            <RequireAuth>{(role) => <DashboardPage initialRole={role} />}</RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PWAInstallButton />
    </>
  );
}
