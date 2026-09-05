import { startTransition, useDeferredValue, useEffect, useState } from "react";

import { ApiError, fetchStudents, type StudentSummary } from "../../../lib/api";
import { StudentSearchPresentation } from "./presentation";

interface Props {
  selectedId?: string | null;
  onSelect: (id: string) => void;
  refreshKey: number;
}

export function StudentSearch({ selectedId, onSelect, refreshKey }: Props) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchStudents(deferredQuery)
      .then((rows) => {
        if (!controller.signal.aborted) {
          setStudents(rows);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        const message = cause instanceof ApiError ? cause.message : "No se pudo cargar el listado";
        setError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [deferredQuery, refreshKey]);

  return (
    <StudentSearchPresentation
      query={query}
      deferredQuery={deferredQuery}
      students={students}
      selectedId={selectedId}
      loading={loading}
      error={error}
      onQueryChange={(value) => startTransition(() => setQuery(value))}
      onSelect={onSelect}
    />
  );
}
