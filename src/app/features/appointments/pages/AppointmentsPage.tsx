
import { useState } from "react";

import AppointmentCalendar from "../components/AppoinmentCalendar";
import AppointmentFormModal from "../components/Appointmentformmodal";

import type { AppointmentFormValues } from "../types/appointmentForm";

import { useAppointments } from "../hooks/useAppointments";

import {
  appointmentToFormValues,
  slotToFormValues,
} from "../utils/Datetime";

interface ModalState {
  mode: "create" | "edit";
  values: AppointmentFormValues;
}

export default function AppointmentsPage() {
  const {
    appointments,
    options,
    loading,
    error,
    reloadAppointments,
    saveAppointment,
    moveAppointment,
  } = useAppointments();

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

      setActionError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la cita. Intenta nuevamente.",
      );

      throw err;
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

      if (!ok) {
        setActionError("No se pudo mover la cita.");
      }

      return ok;
    } catch (err) {
      console.error("Error al mover la cita:", err);
      setActionError("No se pudo mover la cita.");
      return false;
    }
  };

  if (loading && appointments.length === 0 && !error) {
    return <p>Cargando citas...</p>;
  }

  if (error && appointments.length === 0) {
    return (
      <div>
        <p>{error}</p>

        <button
          type="button"
          onClick={() => void reloadAppointments()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      {actionError && <p role="alert">{actionError}</p>}

      {loading && (
        <p aria-live="polite">Actualizando...</p>
      )}

      <AppointmentCalendar
        appointments={appointments}
        onSelectAppointment={(appointment) =>
          setModal({
            mode: "edit",
            values: appointmentToFormValues(appointment),
          })
        }
        onSlotClick={(dateStr, allDay) =>
          setModal({
            mode: "create",
            values: slotToFormValues(dateStr, allDay),
          })
        }
        onMoveAppointment={(appointment, range) =>
          handleMoveAppointment(String(appointment.id), range)
        }
      />

      {modal && (
        <AppointmentFormModal
          mode={modal.mode}
          initialValues={modal.values}
          options={options}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </>
  );
}
