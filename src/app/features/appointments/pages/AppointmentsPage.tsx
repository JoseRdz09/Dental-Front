import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import AppointmentCalendar from "../components/AppoinmentCalendar";
import AppointmentFormModal from "../components/Appointmentformmodal";
import PatientPaymentModal from "../../payment/components/PatientPaymentModal";
import LoadingScreen from "../../../../assets/shared/components/LoadingScreen";

import type { Appointment } from "../types/appointment";
import type {
  AppointmentFormValues,
  AppointmentSubmitValues,
} from "../types/appointmentForm";

import { useAppointments } from "../hooks/useAppointments";
import {
  appointmentToFormValues,
  slotToFormValues,
} from "../utils/Datetime";

/* ==========================================
   TIPOS
========================================== */

type ModalState =
  | { mode: "create"; values: AppointmentFormValues }
  | { mode: "edit"; appointmentId: string; initialPatientName?: string };

interface MonthRange {
  start: string;
  end: string;
}

/* ==========================================
   UTILIDADES
========================================== */

/** Próxima hora en punto, en formato local YYYY-MM-DDTHH:mm */
function getNextAvailableHour(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

function ErrorMessage({
  message,
  onRetry,
  disabled,
}: {
  message: string;
  onRetry: () => void;
  disabled: boolean;
}) {
  return (
    <div role="alert">
      <p>{message}</p>
      <button type="button" onClick={onRetry} disabled={disabled}>
        Reintentar
      </button>
    </div>
  );
}

/* ==========================================
   COMPONENTE PRINCIPAL
========================================== */

export default function AppointmentsPage() {
  const [monthRange, setMonthRange] = useState<MonthRange | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

  const {
    appointments,
    appointmentDetail,
    appointmentDetailLoading,
    appointmentDetailFetching,
    options,
    stats,
    clinicId,
    loading,
    statsLoading,
    error,
    reloadAppointments,
    saveAppointment,
    moveAppointment,
  } = useAppointments(
    monthRange?.start,
    monthRange?.end,
    modal?.mode === "edit" ? modal.appointmentId : null,
  );

  /* Detalle de la cita seleccionada (solo si coincide con el modal abierto). */
  const selectedDetail = useMemo(
    () =>
      modal?.mode === "edit" &&
      appointmentDetail &&
      String(appointmentDetail.id) === modal.appointmentId
        ? appointmentDetail
        : null,
    [modal, appointmentDetail],
  );

  /* Valores del formulario: se derivan, no se copian a estado. */
  const editValues = useMemo(
    () => (selectedDetail ? appointmentToFormValues(selectedDetail) : null),
    [selectedDetail],
  );

  const formValues = modal?.mode === "create" ? modal.values : editValues;

  /* Lo ya pagado de la cita (0 al crear). */
  const alreadyPaid = selectedDetail?.paidTotal ?? 0;

  /* Adeudos */
  const [collect, setCollect] = useState<{ id: number; name: string } | null>(null);

  /* ---------- Handlers ---------- */

  const handleMonthChange = (start: string, end: string) =>
    setMonthRange((current) =>
      current?.start === start && current?.end === end
        ? current
        : { start, end },
    );

  const openModal = (next: ModalState) => {
    toast.dismiss();
    setModal(next);
  };

  const closeModal = () => setModal(null);

  const handleEditAppointment = (appointment: Appointment) =>
    openModal({
      mode: "edit",
      appointmentId: String(appointment.id),
      initialPatientName: appointment.patientName,
    });

  /* El modal muestra sus propios errores, por eso aquí solo se
     relanza (no se duplica el toast). */
  const handleSubmit = async (values: AppointmentSubmitValues) => {
    if (!modal) return;

    const wasEdit = modal.mode === "edit";
    const hadPayment = values.payment !== null;

    await saveAppointment(values);

    setModal(null);

    const base = wasEdit
      ? "La cita se actualizó correctamente"
      : "La cita se registró correctamente";

    toast.success(hadPayment ? `${base} y el pago fue registrado.` : `${base}.`);
  };

  const handleMoveAppointment = async (
    appointmentId: string,
    range: MonthRange,
  ): Promise<boolean> => {
    try {
      const success = await moveAppointment(appointmentId, range);

      if (!success) {
        toast.error("No se pudo mover la cita.");
        return false;
      }

      toast.success("Cita reprogramada correctamente.");
      return true;
    } catch (err) {
      console.error("Error al mover la cita:", err);
      toast.error("No se pudo mover la cita.");
      return false;
    }
  };

  const handleRetry = async () => {
    try {
      await reloadAppointments();
    } catch (err) {
      console.error("Error al cargar las citas:", err);
      toast.error("No se pudieron cargar las citas. Intenta nuevamente.");
    }
  };

  /* ---------- Estados previos al render ---------- */

  if (!clinicId && loading && !error) return <LoadingScreen />;

  if (!clinicId && error)
    return (
      <ErrorMessage
        message={error}
        onRetry={() => void handleRetry()}
        disabled={loading}
      />
    );

  /* ---------- Render ---------- */

  return (
    <>
      {loading && <LoadingScreen />}

      {statsLoading && (
        <p role="status" aria-live="polite">
          Actualizando estadísticas...
        </p>
      )}

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => void handleRetry()}
          disabled={loading}
        />
      )}

      <AppointmentCalendar
        appointments={appointments}
        stats={stats}
        onMonthChange={handleMonthChange}
        onSelectAppointment={handleEditAppointment}
        onSlotClick={(dateStr, allDay) =>
          openModal({
            mode: "create",
            values: slotToFormValues(dateStr, allDay),
          })
        }
        onMoveAppointment={(appointment, range) =>
          handleMoveAppointment(String(appointment.id), range)
        }
        onNewAppointment={() =>
          openModal({
            mode: "create",
            values: slotToFormValues(getNextAvailableHour(), false),
          })
        }
      />

      {modal && clinicId !== null && (
        formValues ? (
          <AppointmentFormModal
            key={modal.mode === "edit" ? modal.appointmentId : "new"}
            mode={modal.mode}
            initialValues={formValues}
            initialPatientName={
              modal.mode === "edit" ? modal.initialPatientName : undefined
            }
            alreadyPaid={alreadyPaid}
            clinicId={clinicId}
            options={options}
            onCollectDebt={setCollect}
            onSubmit={handleSubmit}
            onClose={closeModal}
          />
        ) : (
          <div
            className="appointment-detail-loading"
            role="status"
            aria-live="polite"
          >
            {appointmentDetailLoading || appointmentDetailFetching ? (
              <LoadingScreen />
            ) : (
              <div>
                <p>No se pudo cargar el detalle de la cita.</p>
                <button type="button" onClick={closeModal}>
                  Cerrar
                </button>
              </div>
            )}
          </div>
        )
      )}

      {collect && clinicId !== null && (
        <PatientPaymentModal
          key={collect.id}
          clinicId={clinicId}
          patientId={collect.id}
          patientName={collect.name}
          onClose={() => setCollect(null)}
        />
      )}
    </>
  );
}