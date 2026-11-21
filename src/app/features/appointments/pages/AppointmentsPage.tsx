
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

// ============================================
// TIPOS
// ============================================

interface ModalState {
  mode: "create" | "edit";
  values: AppointmentFormValues;
  initialPatientName?: string;
}

interface MonthRange {
  start: string;
  end: string;
}

// ============================================
// SIGUIENTE HORARIO DISPONIBLE
// ============================================

function getNextAvailableHour(): string {
  const next = new Date();

  next.setHours(next.getHours() + 1, 0, 0, 0);

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AppointmentsPage() {
  // ============================================
  // RANGO DEL MES VISUALIZADO
  // ============================================

  const [monthRange, setMonthRange] =
    useState<MonthRange | null>(null);

  // ============================================
  // CONSULTAS Y ACCIONES
  // ============================================

  const {
    appointments,
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
  );

  // ============================================
  // ESTADOS LOCALES
  // ============================================

  const [modal, setModal] = useState<ModalState | null>(null);

  const [saving, setSaving] = useState(false);

  // ============================================
  // ACTUALIZAR MES VISUALIZADO
  // ============================================

  const handleMonthChange = (
    start: string,
    end: string,
  ) => {
    setMonthRange((current) => {
      if (
        current?.start === start &&
        current?.end === end
      ) {
        return current;
      }

      return { start, end };
    });
  };

  // ============================================
  // ABRIR Y CERRAR MODAL
  // ============================================

  const openModal = (newModal: ModalState) => {
    toast.dismiss();
    setModal(newModal);
  };

  const closeModal = () => {
    if (!saving) {
      setModal(null);
    }
  };

  // ============================================
  // GUARDAR CITA
  // ============================================

  const handleSubmit = async (
    values: AppointmentFormValues,
  ) => {
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

  // ============================================
  // MOVER CITA
  // ============================================

  const handleMoveAppointment = async (
    appointmentId: string,
    range: {
      start: string;
      end: string;
    },
  ): Promise<boolean> => {
    try {
      const success = await moveAppointment(
        appointmentId,
        range,
      );

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

  // ============================================
  // REINTENTAR CONSULTAS
  // ============================================

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

  // ============================================
  // CARGA INICIAL DE CLÍNICAS
  // ============================================

  if (!clinicId && loading && !error) {
    return <LoadingScreen />;
  }

  // ============================================
  // ERROR SIN CLÍNICA DISPONIBLE
  // ============================================

  if (!clinicId && error) {
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

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* ESTADOS DE CARGA */}

      {loading && (
        // <p role="status" aria-live="polite">
        //   Actualizando citas...
        // </p>
        <LoadingScreen />
      )}

      {statsLoading && (
        <p role="status" aria-live="polite">
          Actualizando estadísticas...
        </p>
      )}

      {/* ERROR DE CONSULTA */}

      {error && (
        <div role="alert">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => void handleRetry()}
            disabled={loading}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* CALENDARIO */}

      <AppointmentCalendar
        appointments={appointments}
        stats={stats}
        onMonthChange={handleMonthChange}
        onSelectAppointment={(appointment) =>
          openModal({
            mode: "edit",
            values: appointmentToFormValues(appointment),
            initialPatientName: appointment.patientName,
          })
        }
        onSlotClick={(dateStr, allDay) =>
          openModal({
            mode: "create",
            values: slotToFormValues(dateStr, allDay),
          })
        }
        onMoveAppointment={(appointment, range) =>
          handleMoveAppointment(
            String(appointment.id),
            range,
          )
        }
        onNewAppointment={() =>
          openModal({
            mode: "create",
            values: slotToFormValues(
              getNextAvailableHour(),
              false,
            ),
          })
        }
      />

      {/* MODAL */}

      {modal && clinicId !== null && (
        <AppointmentFormModal
          mode={modal.mode}
          initialValues={modal.values}
          initialPatientName={modal.initialPatientName}
          clinicId={clinicId}
          options={options}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </>
  );
}
