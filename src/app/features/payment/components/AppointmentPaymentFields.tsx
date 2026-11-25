import type { ChangeEvent } from "react";
import type { PaymentFormValues, PaymentMethod } from "../../appointments/types/appointmentForm";
import "../css/AppointmentPaymentFields.css";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
];



export const toCents = (v: string | number) => Math.round(Number(v) * 100);

interface Props {
  total: number;          // total estimado de la cita
  alreadyPaid: number;    // suma de pagos previos (0 en create)
  value: PaymentFormValues;
  onChange: (changes: Partial<PaymentFormValues>) => void;
  formatCurrency: (n: number) => string;
  disabled?: boolean;
}

export default function AppointmentPaymentFields({
  total, alreadyPaid, value, onChange, formatCurrency, disabled,
}: Props) {
  const pendingCents = Math.max(toCents(total) - toCents(alreadyPaid), 0);
  const paying = value.amount.trim() === "" ? 0 : toCents(value.amount);
  const remainingCents = Math.max(pendingCents - paying, 0);

  return (
    <section className="appt-payment">
      <div className="appt-section-header">
        <div>
          <h3>Pago</h3>
          <p>Registra lo que paga el paciente ahora. Lo restante queda como adeudo.</p>
        </div>
      </div>

      <div className="appt-items__summary">
        <div><span>Total</span><strong>{formatCurrency(total)}</strong></div>
        {alreadyPaid > 0 && (
          <div><span>Pagado antes</span><strong>{formatCurrency(alreadyPaid)}</strong></div>
        )}
        <div><span>Pendiente</span><strong>{formatCurrency(pendingCents / 100)}</strong></div>
      </div>

      <div className="appt-row">
        <label className="appt-field">
          <span>Monto recibido (MXN)</span>
          <input
            type="number" min="0" step="0.01" inputMode="decimal"
            value={value.amount}
            placeholder="0.00"
            disabled={disabled || pendingCents === 0}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ amount: e.target.value })}
          />
        </label>

        <label className="appt-field">
          <span>Método de pago</span>
          <select
            value={value.method}
            disabled={disabled}
            onChange={(e) => onChange({ method: e.target.value as PaymentMethod })}
          >
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>
      </div>

      <div className="appt-items__add-action">
        <button
          type="button" className="appt-btn appt-btn--secondary"
          disabled={disabled || pendingCents === 0}
          onClick={() => onChange({ amount: (pendingCents / 100).toFixed(2) })}
        >
          Pagar total pendiente
        </button>
      </div>

      {value.method !== "cash" && (
        <label className="appt-field">
          <span>Referencia (opcional)</span>
          <input
            type="text" maxLength={255} value={value.reference} disabled={disabled}
            placeholder="Folio, últimos 4 dígitos, etc."
            onChange={(e) => onChange({ reference: e.target.value })}
          />
        </label>
      )}

      {paying > 0 && (
        <p className="appt-items__warning">
          Quedará un adeudo de {formatCurrency(remainingCents / 100)}.
        </p>
      )}
    </section>
  );
}