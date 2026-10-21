import { useEffect, useMemo, useState } from "react";
import type { ComponentProps, CSSProperties } from "react";

// ── FullCalendar v7 ──────────────────────────────────────────────
import FullCalendar from "@fullcalendar/react";
import type { EventClickInfo, EventDisplayInfo } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import listPlugin from "@fullcalendar/react/list";
import interactionPlugin from "@fullcalendar/react/interaction";
import themePlugin from "@fullcalendar/react/themes/classic";
import esLocale from "@fullcalendar/react/locales/es";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";
// ─────────────────────────────────────────────────────────────────

import {
  LOCKED_STATUSES,
  STATUS,
  STATUS_ORDER,
  getStatusKey,
} from "../constants/Appointmentstatus";
import type { StatusKey } from "../constants/Appointmentstatus";
import type { Appointment } from "../types/appointment";
import "../css/appointments-calendar.css";

// Los tipos de los handlers se derivan de las props de <FullCalendar>:
// así no dependen de en qué entrypoint decida exportarlos la librería.
type CalendarProps = ComponentProps<typeof FullCalendar>;
type DateClickInfo = Parameters<NonNullable<CalendarProps["dateClick"]>>[0];
type EventMoveInfo =
  | Parameters<NonNullable<CalendarProps["eventDrop"]>>[0]
  | Parameters<NonNullable<CalendarProps["eventResize"]>>[0];

interface Props {
  appointments: Appointment[];
  /** Clic en una cita existente. */
  onSelectAppointment: (appointment: Appointment) => void;
  /** Clic en un hueco vacío. `dateStr` trae hora en vista semana/día y solo fecha en vista mes. */
  onSlotClick: (dateStr: string, allDay: boolean) => void;
  /** Se llama al arrastrar o redimensionar. Devuelve false si falló para revertir el cambio. */
  onMoveAppointment: (
    appointment: Appointment,
    range: { start: string; end: string },
  ) => Promise<boolean> | boolean;
}

function statusVars(key: StatusKey): CSSProperties {
  const s = STATUS[key];
  return {
    "--appt-bg": s.bg,
    "--appt-fg": s.fg,
    "--appt-accent": s.accent,
  } as CSSProperties;
}

function useIsMobile(breakpoint = 700) {
  const query = `(max-width: ${breakpoint}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return isMobile;
}

function renderEventContent({ event, timeText }: EventDisplayInfo) {
  const appointment = event.extendedProps.appointment as Appointment;
  const key = getStatusKey(appointment.status);

  return (
    <div className={`appt appt-${key}`} style={statusVars(key)}>
      <span className="appt__time">{timeText}</span>
      <span className="appt__patient">{appointment.patientName}</span>
      <span className="appt__treatment">{appointment.treatment}</span>
    </div>
  );
}

export default function AppointmentCalendar({
  appointments,
  onSelectAppointment,
  onSlotClick,
  onMoveAppointment,
}: Props) {
  const isMobile = useIsMobile();
  const [hidden, setHidden] = useState<Set<StatusKey>>(new Set());

  const counts = useMemo(() => {
    const result: Record<StatusKey, number> = {
      confirmada: 0,
      pendiente: 0,
      completada: 0,
      cancelada: 0,
    };
    appointments.forEach((a) => {
      result[getStatusKey(a.status)] += 1;
    });
    return result;
  }, [appointments]);

  const events = useMemo(
    () =>
      appointments
        .filter((a) => !hidden.has(getStatusKey(a.status)))
        .map((appointment) => {
          const statusKey = getStatusKey(appointment.status);
          const style = STATUS[statusKey];
          return {
            id: String(appointment.id),
            title: `${appointment.patientName} · ${appointment.treatment}`,
            start: appointment.start,
            end: appointment.end,
            color: style.bg,
            contrastColor: style.fg,
            editable: !LOCKED_STATUSES.includes(statusKey), // solo las activas se arrastran
            extendedProps: { appointment },
          };
        }),
    [appointments, hidden],
  );

  const toggleStatus = (key: StatusKey) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleEventClick = (info: EventClickInfo) => {
    onSelectAppointment(info.event.extendedProps.appointment as Appointment);
  };

  const handleDateClick = (info: DateClickInfo) => {
    onSlotClick(info.dateStr, info.allDay);
  };

  // Arrastrar (eventDrop) y cambiar duración (eventResize) comparten la misma lógica
  const handleMove = async (info: EventMoveInfo) => {
    const appointment = info.event.extendedProps.appointment as Appointment;
    const { startStr, endStr } = info.event;

    const range = {
      start: new Date(startStr).toISOString(),
      // si por alguna razón no hay fin, conserva la duración original
      end: endStr
        ? new Date(endStr).toISOString()
        : new Date(
            new Date(startStr).getTime() +
              (new Date(appointment.end).getTime() - new Date(appointment.start).getTime()),
          ).toISOString(),
    };

    const ok = await onMoveAppointment(appointment, range);
    if (!ok) info.revert();
  };

  return (
    <section className="appointment-calendar" aria-label="Calendario de citas médicas">
      <ul className="appt-legend" aria-label="Filtrar por estado">
        {STATUS_ORDER.map((key) => (
          <li key={key}>
            <button
              type="button"
              className="appt-legend__item"
              style={statusVars(key)}
              aria-pressed={!hidden.has(key)}
              onClick={() => toggleStatus(key)}
            >
              <span className="appt-legend__dot" aria-hidden="true" />
              {STATUS[key].label}
              <span className="appt-legend__count">{counts[key]}</span>
            </button>
          </li>
        ))}
      </ul>

      <FullCalendar
        key={isMobile ? "mobile" : "desktop"}
        plugins={[
          themePlugin,
          dayGridPlugin,
          timeGridPlugin,
          listPlugin,
          interactionPlugin,
        ]}
        locale={esLocale}
        initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
        headerToolbar={
          isMobile
            ? { start: "prev,next", center: "title", end: "today" }
            : {
                start: "title",
                end: "today prev,next dayGridMonth,timeGridWeek,timeGridDay,listWeek",
              }
        }
        footerToolbar={
          isMobile ? { center: "timeGridDay,listWeek,dayGridMonth" } : undefined
        }
        firstDay={1}
        events={events}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        editable
        eventDrop={handleMove}
        eventResize={handleMove}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        height="auto"
        expandRows
        nowIndicator
        allDaySlot={false}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        slotDuration="00:30:00"
        slotHeaderFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        snapDuration="00:15:00"
        scrollTime="08:00:00"
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: "08:00",
          endTime: "20:00",
        }}
        dayMaxEvents={3}
        noEventsText="No hay citas en este periodo"
        dayHeaderFormat={
          isMobile
            ? { weekday: "long", day: "numeric", month: "short" }
            : { weekday: "short", day: "numeric", omitCommas: true }
        }
      />
    </section>
  );
}