import { useState } from "react";

import AppointmentCalendar from "../components/AppoinmentCalendar";
import AppointmentFormModal from "../components/Appointmentformmodal";
import type { AppointmentFormValues } from "../types/appointmentForm";
import { useAppointments } from "../hooks/useAppointments";
import { useClinic } from "../../clinics/hooks/useClinic";
import { appointmentToFormValues, slotToFormValues } from "../utils/Datetime";

interface ModalState {
  mode: "create" | "edit";
  values: AppointmentFormValues;
}

export default function AppointmentsPage() {
  const {
    clinicId,
    loading: clinicLoading,
    error: clinicError,
  } = useClinic();

  const {
    appointments,
    loading,
    error,
    reloadAppointments,
    saveAppointment,
    moveAppointment,
  } = useAppointments(clinicId);

  const [modal, setModal] = useState<ModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const closeModal = () => {
    if (!saving) {
      setModal(null);
      setActionError(null);
    }
  };

  const handleSubmit = async (values: AppointmentFormValues) => {
    setSaving(true);
    setActionError(null);
    try {
      await saveAppointment(values);
      setModal(null);
    } catch (err) {
      console.error("Error al guardar la cita:", err);
      setActionError("No se pudo guardar la cita. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleMoveAppointment = async (
    appointmentId: string,
    range: { start: string; end: string },
  ): Promise<boolean> => {
    setActionError(null);
    try {
      const ok = await moveAppointment(appointmentId, range);
      if (!ok) setActionError("No se pudo mover la cita.");
      return ok; // <- ahora respeta el resultado
    } catch (err) {
      console.error("Error al mover la cita:", err);
      setActionError("No se pudo mover la cita.");
      return false;
    }
  };

  // ── Estados de la clínica (después de todos los hooks) ──
  if (clinicLoading) return <p>Cargando clínica...</p>;
  if (clinicError) return <p>{clinicError}</p>;
  if (clinicId == null) return <p>No tienes una clínica asignada.</p>;

  // Bloquea solo la primera carga; después el calendario sigue montado.
  if (loading && appointments.length === 0 && !error) {
    return <p>Cargando citas...</p>;
  }

  if (error && appointments.length === 0) {
    return (
      <div>
        <p>{error}</p>
        <button type="button" onClick={() => void reloadAppointments()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      {actionError && <p role="alert">{actionError}</p>}
      {loading && <p aria-live="polite">Actualizando...</p>}

      <AppointmentCalendar
        appointments={appointments}
        onSelectAppointment={(appointment) =>
          setModal({ mode: "edit", values: appointmentToFormValues(appointment) })
        }
        onSlotClick={(dateStr, allDay) =>
          setModal({ mode: "create", values: slotToFormValues(dateStr, allDay) })
        }
        onMoveAppointment={(appointment, range) =>
          handleMoveAppointment(String(appointment.id), range)
        }
      />

      {modal && (
        <AppointmentFormModal
          mode={modal.mode}
          initialValues={modal.values}
          onSubmit={handleSubmit}
          onClose={closeModal}
          // loading={saving}  // descomenta si tu modal lo admite
        />
      )}
    </>
  );
}