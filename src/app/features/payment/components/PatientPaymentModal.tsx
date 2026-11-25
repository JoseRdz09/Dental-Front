import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";

import type { PaymentMethod } from "../../appointments/types/appointmentForm";
import {
  usePatientAccount,
  usePatientPaymentActions,
} from "../hooks/usePatientAccount";
import { toCents } from "./AppointmentPaymentFields";

interface Props {
  clinicId: number;
  patientId: number;
  patientName?: string;
  onClose: () => void;
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
];

const ALL = "all";

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

/** Primer mensaje de error legible de una respuesta de Laravel. */
function getErrorMessage(err: unknown): string {
  const e = err as {
    response?: {
      status?: number;
      data?: { message?: string; errors?: Record<string, string[]> };
    };
    message?: string;
  };

  const errors = e.response?.data?.errors;
  const first = errors ? Object.values(errors).flat()[0] : undefined;

  if (first) return first;
  if (e.response?.status === 403) return "No tienes permisos para esta operación.";

  return (
    e.response?.data?.message ??
    e.message ??
    "No se pudo registrar el pago. Inténtalo nuevamente."
  );
}

export default function PatientPaymentModal({
  clinicId,
  patientId,
  patientName,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { data: account, isLoading, isError } = usePatientAccount(
    clinicId,
    patientId,
  );
  const { pay } = usePatientPaymentActions(clinicId, patientId);

  const [target, setTarget] = useState<string>(ALL);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Una clave por apertura: un reintento no duplica el cobro.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const saving = pay.isPending;
  const debts = account?.debts ?? [];

  // Máximo que se puede cobrar según el destino elegido.
  const selected =
    target === ALL ? null : debts.find((d) => String(d.id) === target) ?? null;

  const maxCents = toCents(selected ? selected.balance : (account?.totalDebt ?? 0));
  const typedCents = amount.trim() === "" ? 0 : toCents(amount);
  const remainingCents = Math.max(maxCents - typedCents, 0);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;

    if (!Number.isFinite(typedCents) || typedCents <= 0)
      return setError("Ingresa un monto válido.");

    if (typedCents > maxCents)
      return setError("El pago no puede ser mayor al adeudo.");

    try {
      setError(null);

      await pay.mutateAsync({
        amount: typedCents / 100,
        method,
        reference:
          method === "cash" ? null : reference.trim() || null,
        appointmentId: selected ? selected.id : null,
        idempotencyKey,
      });

      toast.success("El pago se registró correctamente.");
      onClose();
    } catch (err) {
      console.error("Error al registrar el pago:", err);
      setError(getErrorMessage(err));
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="appt-modal"
      aria-labelledby="debt-modal-title"
      onClose={onClose}
      onCancel={(e) => saving && e.preventDefault()}
      onClick={(e) => {
        if (e.target === dialogRef.current && !saving) onClose();
      }}
    >
      <form className="appt-modal__form" onSubmit={handleSubmit} noValidate>
        <h2 id="debt-modal-title" className="appt-modal__title">
          Cobrar adeudo{patientName ? ` — ${patientName}` : ""}
        </h2>

        {isLoading && <p role="status">Cargando adeudo…</p>}

        {isError && (
          <p className="appt-modal__error" role="alert">
            No se pudo cargar el adeudo del paciente.
          </p>
        )}

        {account && debts.length === 0 && (
          <p role="status">Este paciente no tiene adeudos pendientes.</p>
        )}

        {account && debts.length > 0 && (
          <>
            <div className="appt-items__summary">
              <div>
                <span>Adeudo total</span>
                <small>
                  {debts.length} {debts.length === 1 ? "cita" : "citas"} con
                  saldo
                </small>
              </div>
              <strong>{formatCurrency(account.totalDebt)}</strong>
            </div>

            <div className="appt-items__table">
              {debts.map((d) => (
                <div className="appt-items__item" key={d.id}>
                  <div className="appt-items__item-info">
                    <strong>{d.title}</strong>
                    <span>
                      {formatDate(d.startAt)} · Total {formatCurrency(d.total)}{" "}
                      · Pagado {formatCurrency(d.paidTotal)}
                    </span>
                  </div>
                  <strong className="appt-items__total">
                    {formatCurrency(d.balance)}
                  </strong>
                </div>
              ))}
            </div>

            <label className="appt-field">
              <span>Aplicar a</span>
              <select
                value={target}
                onChange={(e) => {
                  setTarget(e.target.value);
                  setAmount("");
                  setError(null);
                }}
                disabled={saving}
              >
                <option value={ALL}>
                  Todo el adeudo (las más antiguas primero)
                </option>
                {debts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatDate(d.startAt)} — {d.title} (
                    {formatCurrency(d.balance)})
                  </option>
                ))}
              </select>
            </label>

            <div className="appt-row">
              <label className="appt-field">
                <span>Monto recibido (MXN)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                  disabled={saving}
                />
              </label>

              <label className="appt-field">
                <span>Método de pago</span>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  disabled={saving}
                >
                  {METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="appt-items__add-action">
              <button
                type="button"
                className="appt-btn appt-btn--secondary"
                onClick={() => setAmount((maxCents / 100).toFixed(2))}
                disabled={saving}
              >
                Pagar todo ({formatCurrency(maxCents / 100)})
              </button>
            </div>

            {method !== "cash" && (
              <label className="appt-field">
                <span>Referencia (opcional)</span>
                <input
                  type="text"
                  maxLength={255}
                  placeholder="Folio, últimos 4 dígitos, etc."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={saving}
                />
              </label>
            )}

            {typedCents > 0 && typedCents <= maxCents && (
              <p className="appt-items__warning">
                {remainingCents === 0
                  ? "Con este pago el adeudo quedará liquidado."
                  : `Después de este pago quedará un adeudo de ${formatCurrency(remainingCents / 100)}.`}
              </p>
            )}
          </>
        )}

        {error && (
          <div className="appt-modal__error" role="alert" aria-live="assertive">
            <div className="appt-modal__error-header">
              <span className="appt-modal__error-icon">!</span>
              <strong>No se pudo registrar el pago</strong>
            </div>
            <p>{error}</p>
          </div>
        )}

        <div className="appt-modal__actions">
          <button
            type="button"
            className="appt-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cerrar
          </button>

          {debts.length > 0 && (
            <button
              type="submit"
              className="appt-btn appt-btn--primary"
              disabled={saving}
            >
              {saving ? "Guardando…" : "Registrar pago"}
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}