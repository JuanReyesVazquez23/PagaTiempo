import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PaymentLedger } from "../components/features/PaymentLedger";
import { StudentSearch } from "../components/features/StudentSearch";
import { MonthGrid } from "../components/ui/MonthGrid";
import { fetchMe, fetchStudent, logout, type StudentDetail } from "../lib/api";

export function DashboardPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Si alguien entra directo a /panel sin sesión (o la cookie expiró),
  // /api/auth/me responde 401 y lo mandamos de vuelta al login en vez
  // de mostrarle un panel vacío que parece roto.
  useEffect(() => {
    let active = true;
    fetchMe()
      .catch(() => {
        if (active) navigate("/", { replace: true });
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    fetchStudent(selectedId)
      .then((row) => {
        setDetail(row);
        setLoadError(null);
      })
      .catch(() => setLoadError("No se pudo abrir el historial"));
  }, [selectedId]);

  async function onLogout(): Promise<void> {
    await logout();
    navigate("/");
  }

  if (checkingSession) {
    return (
      <main className="shell">
        <p className="panel empty">Verificando sesión…</p>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-badge" aria-hidden="true">PT</div>
          <div>
            <span className="eyebrow">Ciclo Sep 2026 — Jun 2027</span>
            <h1>Libro de Cuotas</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="role-tag">Tesorera</span>
          <button type="button" className="btn-ghost" onClick={onLogout} aria-label="Cerrar sesión">
            Salir →
          </button>
        </div>
      </header>
      <div className="layout">
        <StudentSearch
          selectedId={selectedId}
          refreshKey={refreshKey}
          onSelect={(id) => {
            setSelectedId(id);
          }}
        />
        <div className="detail">
          {loadError ? (
            <p className="alert" role="alert">
              <span aria-hidden="true">⚠️</span> {loadError}
            </p>
          ) : null}
          {detail ? (
            <>
              <MonthGrid months={detail.installments} />
              <PaymentLedger
                student={detail}
                onUpdated={(next) => {
                  setDetail(next);
                  setRefreshKey((value) => value + 1);
                }}
              />
            </>
          ) : (
            <div className="panel empty-hero">
              <div className="empty-hero-icon" aria-hidden="true">📋</div>
              <h3>Selecciona un estudiante</h3>
              <p className="hint">Elige un nombre en la lista de la izquierda para ver su historial de 10 meses y registrar cuotas.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
