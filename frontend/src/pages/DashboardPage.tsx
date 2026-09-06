import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PaymentLedger } from "../components/features/PaymentLedger";
import { StudentSearch } from "../components/features/StudentSearch";
import { Modal } from "../components/ui/Modal";
import { MonthGrid } from "../components/ui/MonthGrid";
import {
  ApiError,
  createStudent,
  deleteStudent,
  fetchMe,
  fetchStudent,
  logout,
  resetAllAccounts,
  resetStudentAccount,
  type StudentDetail,
} from "../lib/api";

export function DashboardPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"treasurer" | "admin">("treasurer");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentError, setNewStudentError] = useState<string | null>(null);

  const [showResetStudentModal, setShowResetStudentModal] = useState(false);
  const [resetStudentError, setResetStudentError] = useState<string | null>(null);

  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [deleteStudentError, setDeleteStudentError] = useState<string | null>(null);

  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [resetAllError, setResetAllError] = useState<string | null>(null);

  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    let active = true;
    fetchMe()
      .then((data) => {
        if (active) {
          setRole(data.role);
        }
      })
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
  }, [selectedId, refreshKey]);

  async function onLogout(): Promise<void> {
    await logout();
    navigate("/");
  }

  

  async function handleCreateStudent(e: FormEvent): Promise<void> {
    e.preventDefault();
    setNewStudentError(null);
    try {
      const created = await createStudent(newStudentName);
      setShowNewStudentModal(false);
      setNewStudentName("");
      setRefreshKey((k) => k + 1);
      setSelectedId(created.id);
      setDetail(created);
      setActionNotice(`Estudiante "${created.full_name}" agregado con éxito`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (cause: unknown) {
      setNewStudentError(cause instanceof ApiError ? cause.message : "No se pudo agregar al estudiante");
    }
  }

  async function handleResetStudent(): Promise<void> {
    if (!selectedId) return;
    setResetStudentError(null);
    try {
      const updated = await resetStudentAccount(selectedId);
      setDetail(updated);
      setRefreshKey((k) => k + 1);
      setShowResetStudentModal(false);
      setActionNotice(`Cuenta de "${updated.full_name}" limpiada exitosamente`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (cause: unknown) {
      setResetStudentError(cause instanceof ApiError ? cause.message : "No se pudo limpiar la cuenta");
    }
  }

  async function handleDeleteStudent(): Promise<void> {
    if (!selectedId || !detail) return;
    setDeleteStudentError(null);
    const deletedName = detail.full_name;
    try {
      await deleteStudent(selectedId);
      setSelectedId(null);
      setDetail(null);
      setRefreshKey((k) => k + 1);
      setShowDeleteStudentModal(false);
      setActionNotice(`Estudiante "${deletedName}" eliminado del sistema`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (cause: unknown) {
      setDeleteStudentError(cause instanceof ApiError ? cause.message : "No se pudo eliminar al estudiante");
    }
  }

  async function handleResetAll(): Promise<void> {
    setResetAllError(null);
    try {
      await resetAllAccounts();
      setRefreshKey((k) => k + 1);
      if (selectedId) {
        const reloaded = await fetchStudent(selectedId);
        setDetail(reloaded);
      }
      setShowResetAllModal(false);
      setActionNotice("Todas las cuentas del ciclo escolar han sido limpiadas");
      setTimeout(() => setActionNotice(null), 4000);
    } catch (cause: unknown) {
      setResetAllError(cause instanceof ApiError ? cause.message : "No se pudieron limpiar las cuentas");
    }
  }

  if (checkingSession) {
    return (
      <main className="shell">
        <p className="panel empty">Verificando sesión…</p>
      </main>
    );
  }

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShowPWAInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [deferredPrompt, showPWAInstall]);

  const isAdmin = role === "admin";

  return (
    <main className="shell">
      {actionNotice ? (
        <div className="action-toast" role="status">
          <span>✨</span> {actionNotice}
        </div>
      ) : null}

      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-badge" aria-hidden="true">PT</div>
          <div>
            <span className="eyebrow">Ciclo Sep 2026 — Jun 2027</span>
            <h1>Libro de Cuotas</h1>
          </div>
        </div>
<div className="topbar-actions">
{role === "admin" ? (
            <>
              <span className="role-tag admin-tag">👑 Administrador</span>
              <button
                type="button"
                className="btn-ghost btn-warn-ghost"
                onClick={() => {
                  setResetAllError(null);
                  setShowResetAllModal(true);
                }}
                title="Limpiar y reiniciar todas las cuentas del ciclo"
              >
                Limpiar todo el ciclo
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setRole("treasurer")}
                title="Volver modo tesorera"
              >
                Salir de Admin
              </button>
            </>
          ) : (
            <>
              <span className="role-tag">Tesorera</span>
            </>
          )}
          {showPWAInstall ? (
            <button
              onClick={() => setShowPWAInstall(false)}
              className="pwa-install-btn"
              aria-label="Cancelar instalación de PWA"
            >
              Cancelar
            </button>
          ) : (
            <button
              onClick={() => setShowPWAInstall(true)}
              className="pwa-install-btn"
              aria-label="Agregar PagaTiempo a la pantalla principal"
            >
              Agregar a la pantalla principal
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={onLogout} aria-label="Cerrar sesión">
            Salir →
          </button>
        </div>
      </header>

      <div className="layout">
        <StudentSearch
          selectedId={selectedId}
          refreshKey={refreshKey}
          isAdmin={isAdmin}
          onNewStudent={() => {
            setNewStudentError(null);
            setNewStudentName("");
            setShowNewStudentModal(true);
          }}
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
                isAdmin={isAdmin}
                onResetStudent={() => {
                  setResetStudentError(null);
                  setShowResetStudentModal(true);
                }}
                onDeleteStudent={() => {
                  setDeleteStudentError(null);
                  setShowDeleteStudentModal(true);
                }}
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
              <p className="hint">
                Elige un nombre en la lista de la izquierda para ver su historial de 10 meses y registrar cuotas.
              </p>
              {isAdmin ? (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: "1rem" }}
                  onClick={() => {
                    setNewStudentError(null);
                    setNewStudentName("");
                    setShowNewStudentModal(true);
                  }}
                >
                  + Agregar nuevo estudiante
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Agregar Nuevo Estudiante */}
      <Modal
        isOpen={showNewStudentModal}
        onClose={() => setShowNewStudentModal(false)}
        title="Agregar Nuevo Estudiante"
      >
        <form onSubmit={handleCreateStudent}>
          <p className="hint" style={{ marginBottom: "1rem" }}>
            El nuevo estudiante será incorporado con sus 10 cuotas correspondientes al ciclo escolar.
          </p>
          <div className="field">
            <label htmlFor="new-student-name">Nombre completo del estudiante</label>
            <input
              id="new-student-name"
              type="text"
              autoFocus
              required
              minLength={2}
              maxLength={120}
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Ej. Ana Lucía Martínez"
              className="neu-input"
            />
          </div>
          {newStudentError ? (
            <p className="alert" role="alert">
              <span aria-hidden="true">⚠️</span> {newStudentError}
            </p>
          ) : null}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowNewStudentModal(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar Estudiante
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmar Limpiar Cuenta de un Estudiante */}
      <Modal
        isOpen={showResetStudentModal}
        onClose={() => setShowResetStudentModal(false)}
        title="Limpiar cuenta del estudiante"
      >
        <div>
          <p style={{ marginBottom: "1rem" }}>
            ¿Estás seguro de que deseas limpiar la cuenta de{" "}
            <strong>{detail?.full_name}</strong>?
          </p>
          <p className="hint" style={{ marginBottom: "1rem" }}>
            ⚠️ Se eliminarán todos los pagos registrados de este estudiante y todas sus cuotas mensuales volverán a estar pendientes (0.00 DOP).
          </p>
          {resetStudentError ? (
            <p className="alert" role="alert">
              <span aria-hidden="true">⚠️</span> {resetStudentError}
            </p>
          ) : null}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowResetStudentModal(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={handleResetStudent}
            >
              Sí, limpiar cuenta
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar Eliminar Estudiante */}
      <Modal
        isOpen={showDeleteStudentModal}
        onClose={() => setShowDeleteStudentModal(false)}
        title="Eliminar Estudiante"
      >
        <div>
          <p style={{ marginBottom: "1rem" }}>
            ¿Estás seguro de que deseas eliminar permanentemente a{" "}
            <strong>{detail?.full_name}</strong>?
          </p>
          <p className="hint" style={{ marginBottom: "1rem" }}>
            🚨 Se eliminará al estudiante junto con sus 10 cuotas y todo su historial de recibos. Esta acción no se puede deshacer.
          </p>
          {deleteStudentError ? (
            <p className="alert" role="alert">
              <span aria-hidden="true">⚠️</span> {deleteStudentError}
            </p>
          ) : null}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowDeleteStudentModal(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={handleDeleteStudent}
            >
              Sí, eliminar definitivamente
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar Limpiar Todas las Cuentas */}
      <Modal
        isOpen={showResetAllModal}
        onClose={() => setShowResetAllModal(false)}
        title="Limpiar todas las cuentas del ciclo"
      >
        <div>
          <p style={{ marginBottom: "1rem" }}>
            ¿Estás seguro de que deseas <strong>limpiar las cuentas de todos los estudiantes</strong>?
          </p>
          <p className="hint" style={{ marginBottom: "1rem" }}>
            🚨 Esta acción borrará el historial de pagos completo de toda la institución y dejará las cuotas de todos los estudiantes en estado pendiente (0.00 DOP).
          </p>
          {resetAllError ? (
            <p className="alert" role="alert">
              <span aria-hidden="true">⚠️</span> {resetAllError}
            </p>
          ) : null}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowResetAllModal(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={handleResetAll}
            >
              Sí, limpiar todo el ciclo
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
