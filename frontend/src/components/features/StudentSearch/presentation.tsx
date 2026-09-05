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
  loading: boolean;
  error: string | null;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
}

export function StudentSearchPresentation({
  query,
  deferredQuery,
  students,
  loading,
  error,
  onQueryChange,
  onSelect,
}: StudentSearchPresentationProps) {
  return (
    <section className="panel" aria-labelledby="search-heading">
      <h2 id="search-heading">Estudiantes</h2>
      <label htmlFor="student-search">Buscar por nombre</label>
      <input
        id="student-search"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Juan, María, Pedro…"
        autoComplete="off"
      />
      {deferredQuery !== query ? <p className="hint">Filtrando…</p> : null}
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p>Cargando listado…</p> : null}
      <ul className="student-list">
        {students.map((student) => (
          <li key={student.id}>
            <button type="button" className="student-row" onClick={() => onSelect(student.id)}>
              <span>{student.full_name}</span>
              <span>
                {student.total_paid} / {student.total_expected}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!loading && students.length === 0 ? <p>Ningún estudiante coincide.</p> : null}
    </section>
  );
}
