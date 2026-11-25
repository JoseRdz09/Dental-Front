import { useMemo, useState } from "react";

import LoadingScreen from "../../../../assets/shared/components/LoadingScreen";

import PatientPaymentModal from "../components/PatientPaymentModal";
import { useActiveClinic } from "../hooks/debtors/useActiveClinic";
import { useReceivables } from "../hooks/usePatientAccount";

import "../css/PaymentPage.css";

/* ==========================================
   UTILIDADES
========================================== */

type SortBy = "oldest" | "amount" | "name";

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

const daysSince = (iso: string) =>
  Math.max(Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000), 0);

/* ==========================================
   COMPONENTE
========================================== */

export default function PaymentsPage() {
  const {
    clinics,
    clinicId,
    selectClinic,
    loading: clinicsLoading,
    error: clinicsError,
  } = useActiveClinic();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useReceivables(clinicId);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("oldest");
  const [collect, setCollect] = useState<{ id: number; name: string } | null>(
    null,
  );

  const patients = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = (data?.patients ?? []).filter(
      (p) => !term || p.patientName.toLowerCase().includes(term),
    );

    // El backend ya los envía del adeudo más antiguo al más reciente.
    if (sortBy === "amount") {
      return [...filtered].sort((a, b) => b.balance - a.balance);
    }

    if (sortBy === "name") {
      return [...filtered].sort((a, b) =>
        a.patientName.localeCompare(b.patientName, "es"),
      );
    }

    return filtered;
  }, [data, search, sortBy]);

  const oldestDays = useMemo(() => {
    const first = data?.patients[0];
    return first ? daysSince(first.oldestAt) : 0;
  }, [data]);

  /* ---------- Estados previos al render ---------- */

  if (clinicsLoading) return <LoadingScreen />;

  if (clinicsError || clinicId === null) {
    return (
      <section className="pay-page">
        <p role="alert">
          {clinicsError
            ? "No se pudieron cargar las clínicas."
            : "No hay una clínica disponible."}
        </p>
      </section>
    );
  }

  /* ---------- Render ---------- */

  return (
    <section className="pay-page">
      <header className="pay-page__header">
        <div>
          <h1>Pagos</h1>
          <p>Pacientes con adeudo en citas completadas.</p>
        </div>

        {clinics.length > 1 && (
          <label className="pay-field">
            <span>Clínica</span>
            <select
              value={clinicId}
              onChange={(e) => selectClinic(Number(e.target.value))}
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {isLoading && <LoadingScreen />}

      {isError && (
        <div className="pay-alert" role="alert">
          <p>No se pudieron cargar las cuentas por cobrar.</p>
          <button type="button" onClick={() => void refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {data && (
        <>
          {/* RESUMEN */}
          <div className="pay-summary">
            <article className="pay-card pay-card--debt">
              <span>Total por cobrar</span>
              <strong>{formatCurrency(data.total)}</strong>
            </article>

            <article className="pay-card">
              <span>Pacientes con adeudo</span>
              <strong>{data.patientsCount}</strong>
            </article>

            <article className="pay-card">
              <span>Adeudo más antiguo</span>
              <strong>
                {data.patientsCount === 0 ? "—" : `${oldestDays} días`}
              </strong>
            </article>
          </div>

          {data.patientsCount === 0 ? (
            <div className="pay-empty">
              <strong>Sin adeudos pendientes</strong>
              <p>Todas las citas completadas están pagadas.</p>
            </div>
          ) : (
            <>
              {/* FILTROS */}
              <div className="pay-filters">
                <label className="pay-field">
                  <span>Buscar paciente</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nombre…"
                    autoComplete="off"
                  />
                </label>

                <label className="pay-field">
                  <span>Ordenar por</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                  >
                    <option value="oldest">Adeudo más antiguo</option>
                    <option value="amount">Mayor monto</option>
                    <option value="name">Nombre</option>
                  </select>
                </label>

                {isFetching && !isLoading && (
                  <span className="pay-filters__status" role="status">
                    Actualizando…
                  </span>
                )}
              </div>

              {/* LISTA */}
              <div className="pay-table-wrap">
                <table className="pay-table">
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Citas con saldo</th>
                      <th>Adeudo desde</th>
                      <th className="pay-table__num">Adeudo</th>
                      <th aria-label="Acciones" />
                    </tr>
                  </thead>

                  <tbody>
                    {patients.length === 0 && (
                      <tr>
                        <td colSpan={5}>No se encontraron pacientes.</td>
                      </tr>
                    )}

                    {patients.map((p) => (
                      <tr key={p.patientId}>
                        <td>
                          <strong>{p.patientName}</strong>
                        </td>
                        <td>{p.appointmentsCount}</td>
                        <td>
                          {formatDate(p.oldestAt)}
                          <small> · {daysSince(p.oldestAt)} días</small>
                        </td>
                        <td className="pay-table__num pay-table__debt">
                          {formatCurrency(p.balance)}
                        </td>
                        <td className="pay-table__actions">
                          <button
                            type="button"
                            className="pay-btn pay-btn--primary"
                            onClick={() =>
                              setCollect({ id: p.patientId, name: p.patientName })
                            }
                          >
                            Cobrar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {collect && (
        <PatientPaymentModal
          key={collect.id}
          clinicId={clinicId}
          patientId={collect.id}
          patientName={collect.name}
          onClose={() => setCollect(null)}
        />
      )}
    </section>
  );
}