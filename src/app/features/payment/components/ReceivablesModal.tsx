import { useEffect, useMemo, useRef, useState } from "react";

import { useReceivables } from "../../payment/hooks/usePatientAccount";

interface Props {
  clinicId: number;
  onCollect: (patient: { id: number; name: string }) => void;
  onClose: () => void;
}

type SortBy = "oldest" | "amount";

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const formatCurrency = (n: number) => money.format(n);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/** Días transcurridos desde la fecha de la cita más antigua con adeudo. */
const daysSince = (iso: string) =>
  Math.max(
    Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000),
    0,
  );

export default function ReceivablesModal({
  clinicId,
  onCollect,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { data, isLoading, isError, refetch } = useReceivables(clinicId);

  const [sortBy, setSortBy] = useState<SortBy>("oldest");
  const [search, setSearch] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const patients = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = (data?.patients ?? []).filter(
      (p) => !term || p.patientName.toLowerCase().includes(term),
    );

    // El backend ya los envía por antigüedad; solo se reordena si se pide.
    return sortBy === "amount"
      ? [...filtered].sort((a, b) => b.balance - a.balance)
      : filtered;
  }, [data, search, sortBy]);

  return (
    <dialog
      ref={dialogRef}
      className="appt-modal"
      aria-labelledby="receivables-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="appt-modal__form">
        <h2 id="receivables-title" className="appt-modal__title">
          Cuentas por cobrar
        </h2>

        {isLoading && <p role="status">Cargando adeudos…</p>}

        {isError && (
          <div className="appt-modal__error" role="alert">
            <p>No se pudieron cargar las cuentas por cobrar.</p>
            <button
              type="button"
              className="appt-btn"
              onClick={() => void refetch()}
            >
              Reintentar
            </button>
          </div>
        )}

        {data && (
          <>
            <div className="appt-items__summary">
              <div>
                <span>Total por cobrar</span>
                <small>
                  {data.patientsCount}{" "}
                  {data.patientsCount === 1 ? "paciente" : "pacientes"} con
                  adeudo
                </small>
              </div>
              <strong>{formatCurrency(data.total)}</strong>
            </div>

            {data.patientsCount === 0 ? (
              <div className="appt-items__empty">
                <strong>Sin adeudos pendientes</strong>
                <p>Todas las citas completadas están pagadas.</p>
              </div>
            ) : (
              <>
                <div className="appt-row">
                  <label className="appt-field">
                    <span>Buscar paciente</span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nombre…"
                      autoComplete="off"
                    />
                  </label>

                  <label className="appt-field">
                    <span>Ordenar por</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                    >
                      <option value="oldest">Adeudo más antiguo</option>
                      <option value="amount">Mayor monto</option>
                    </select>
                  </label>
                </div>

                <div className="appt-items__table">
                  {patients.length === 0 && (
                    <p role="status">No se encontraron pacientes.</p>
                  )}

                  {patients.map((p) => (
                    <div className="appt-items__item" key={p.patientId}>
                      <div className="appt-items__item-info">
                        <strong>{p.patientName}</strong>
                        <span>
                          {p.appointmentsCount}{" "}
                          {p.appointmentsCount === 1 ? "cita" : "citas"} · desde{" "}
                          {formatDate(p.oldestAt)} ({daysSince(p.oldestAt)}{" "}
                          días)
                        </span>
                      </div>

                      <strong className="appt-items__total">
                        {formatCurrency(p.balance)}
                      </strong>

                      <button
                        type="button"
                        className="appt-btn appt-btn--secondary"
                        onClick={() =>
                          onCollect({ id: p.patientId, name: p.patientName })
                        }
                      >
                        Cobrar
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="appt-modal__actions">
          <button type="button" className="appt-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  );
}