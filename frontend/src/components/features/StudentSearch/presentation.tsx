export interface StudentRow {
  id: string;
  full_name: string;
  total_paid: string;
  total_expected: string;
}


export interface StudentSearchPresentationProps {
  query: string;
  deferredQuery: string;
  students: StudentRow[];
  selectedId?: string | null;
  loading: boolean;
  error: string | null;
  isAdmin?: boolean;
  onNewStudent?: () => void;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function StudentSearchPresentation({
  query,
  deferredQuery,
  students,
  selectedId,
  loading,
  error,
  isAdmin,
  onNewStudent,
  onQueryChange,
  onSelect,
}: StudentSearchPresentationProps) {
  return (
    <section className="panel search-panel" aria-labelledby="search-heading">
      <div className="panel-header">
        <div className="panel-header-title-group">
          <h2 id="search-heading" className="panel-title">
            Estudiantes
          </h2>
          <span className="badge-counter">{students.length}</span>
        </div>
        {isAdmin && onNewStudent ? (
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={onNewStudent}
            title="Agregar un nuevo estudiante"
          >
            + Nuevo
          </button>
        ) : null}
      </div>

      <div className="field search-field">
        <label htmlFor="student-search">Buscar estudiante</label>
        <div className="input-with-icon">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            id="student-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar por nombre o apellido…"
            autoComplete="off"
            className="neu-input search-input"
          />
        </div>
      </div>

      {deferredQuery !== query ? (
        <p className="hint hint-filtering">
          <span className="spinner-dot" /> Filtrando…
        </p>
      ) : null}

      {error ? (
        <p className="alert" role="alert">
          <span aria-hidden="true">⚠️</span> {error}
        </p>
      ) : null}

      {loading ? (
        <div className="loading-state">
          <p className="hint">Cargando listado…</p>
        </div>
      ) : null}

      <ul className="student-list" aria-label="Lista de estudiantes">
        {students.map((student) => {
          const isSelected = selectedId === student.id;
          const paid = parseFloat(student.total_paid) || 0;
          const total = parseFloat(student.total_expected) || 0;
          const isComplete = total > 0 && paid >= total;

          return (
            <li key={student.id}>
              <button
                type="button"
                className={`student-row ${isSelected ? "is-selected" : ""}`}
                onClick={() => onSelect(student.id)}
                aria-current={isSelected ? "true" : undefined}
              >
                <div className="student-row-main">
                  <span className="student-avatar" aria-hidden="true">
                    {getInitials(student.full_name)}
                  </span>
                  <div className="student-info">
                    <span className="student-name">{student.full_name}</span>
                    <span className="student-status-text">
                      {isComplete ? "Completado" : "En curso"}
                    </span>
                  </div>
                </div>
                <div className="student-balance-chip">
                  <span className="chip-paid">${student.total_paid}</span>
                  <span className="chip-divider">/</span>
                  <span className="chip-total">${student.total_expected}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {!loading && students.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">Ningún estudiante coincide con la búsqueda.</p>
        </div>
      ) : null}
    </section>
  );
}
