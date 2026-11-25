import { usePatientAccount } from "../hooks/usePatientAccount";
import "../css/PatientDebtNotice.css";

interface Props {
  clinicId: number;
  patientId: number;
  /** Cita que se está editando: su saldo ya se muestra en su sección de pago. */
  excludeAppointmentId?: number;
  onCollect: () => void;
  formatCurrency: (n: number) => string;
  disabled?: boolean;
}

export default function PatientDebtNotice({
  clinicId,
  patientId,
  excludeAppointmentId,
  onCollect,
  formatCurrency,
  disabled,
}: Props) {
  const { data } = usePatientAccount(clinicId, patientId);

  const previous = (data?.debts ?? []).filter(
    (d) => d.id !== excludeAppointmentId,
  );

  if (previous.length === 0) return null;

  const total = previous.reduce((sum, d) => sum + d.balance, 0);

  return (
    <div className="appt-items__warning" role="status">
      <p>
        Este paciente tiene un adeudo anterior de{" "}
        <strong>{formatCurrency(total)}</strong> en {previous.length}{" "}
        {previous.length === 1 ? "cita" : "citas"}.
      </p>

      <button
        type="button"
        className="appt-btn appt-btn--secondary"
        onClick={onCollect}
        disabled={disabled}
      >
        Cobrar adeudo
      </button>
    </div>
  );
}