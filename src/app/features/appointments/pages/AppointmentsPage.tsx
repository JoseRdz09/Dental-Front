
import { useState } from "react";
import toast from "react-hot-toast";

import AppointmentCalendar from "../components/AppoinmentCalendar";
import AppointmentFormModal from "../components/Appointmentformmodal";
import LoadingScreen from "../../../../assets/shared/components/LoadingScreen";

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

function getNextAvailableHour(): string {
  const next = new Date();
  next.setHours(next.getHours() + 1, 0, 0, 0);

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
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

  const openModal = (newModal: ModalState) => {
    toast.dismiss();
    setModal(newModal);
  };

  const closeModal = () => {
    if (!saving) {
      setModal(null);
    }
  };

  const handleSubmit = async (values: AppointmentFormValues) => {
    if (saving || !modal) return;

    const mode = modal.mode;

    setSaving(true);

    try {
      await saveAppointment(values);

      setModal(null);

      toast.success(
        mode === "edit"
          ? "La cita se actualizó correctamente."
          : "La cita se registró correctamente.",
      );
    } catch (err) {
      console.error("Error al guardar la cita:", err);

      toast.error(
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
    try {
      const success = await moveAppointment(appointmentId, range);

      if (!success) {
        toast.error("No se pudo mover la cita.");
      }

      return success;
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

      toast.error(
        "No se pudieron cargar las citas. Intenta nuevamente.",
      );
    }
  };

  if (loading && appointments.length === 0 && !error) {
    return <LoadingScreen />;
  }

  if (error && appointments.length === 0) {
    return (
      <div>
        <p role="alert">{error}</p>

        <button
          type="button"
          onClick={() => void handleRetry()}
          disabled={loading}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <p role="status" aria-live="polite">
          Actualizando citas...
        </p>
      )}

      <AppointmentCalendar
        appointments={appointments}
        onSelectAppointment={(appointment) =>
          openModal({
            mode: "edit",
            values: appointmentToFormValues(appointment),
          })
        }
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
