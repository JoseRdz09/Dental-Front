import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ComponentProps,
  ComponentRef,
  CSSProperties,
} from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import listPlugin from "@fullcalendar/react/list";
import interactionPlugin from "@fullcalendar/react/interaction";
import themePlugin from "@fullcalendar/react/themes/classic";
import esLocale from "@fullcalendar/react/locales/es";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

import {
  LOCKED_STATUSES,
  STATUS,
  getStatusKey,
} from "../constants/Appointmentstatus";
import type { StatusKey } from "../constants/Appointmentstatus";
import type { Appointment } from "../types/appointment";
import type { ApiAppointmentStats } from "../services/appointmentService";

import "../css/appointments-calendar.css";

/* ==========================================
   TIPOS
========================================== */

type CalendarProps = ComponentProps<typeof FullCalendar>;
type CalendarInstance = ComponentRef<typeof FullCalendar>;

type DateClickInfo = Parameters<NonNullable<CalendarProps["dateClick"]>>[0];
type EventClickInfo = Parameters<NonNullable<CalendarProps["eventClick"]>>[0];
type DatesSetInfo = Parameters<NonNullable<CalendarProps["datesSet"]>>[0];
type EventMoveInfo =
  | Parameters<NonNullable<CalendarProps["eventDrop"]>>[0]
  | Parameters<NonNullable<CalendarProps["eventResize"]>>[0];

type CalendarView =
  | "dayGridMonth"
  | "timeGridWeek"
  | "timeGridDay"
  | "listWeek";

interface Props {
  appointments: Appointment[];
  stats: ApiAppointmentStats;
  onMonthChange: (start: string, end: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onSlotClick: (dateStr: string, allDay: boolean) => void;
  onMoveAppointment: (
    appointment: Appointment,
    range: { start: string; end: string },
  ) => Promise<boolean> | boolean;
  onNewAppointment: () => void;
}

/* ==========================================
   CONSTANTES
========================================== */

const VIEWS: readonly [CalendarView, string][] = [
  ["dayGridMonth", "Mes"],
  ["timeGridWeek", "Semana"],
  ["timeGridDay", "Día"],
  ["listWeek", "Agenda"],
];

const STAT_CARDS: readonly [
  keyof ApiAppointmentStats,
  string,
  string,
][] = [
  ["today", "today", "Citas hoy"],
  ["pending", "pending", "Por confirmar"],
  ["upcoming", "confirmed", "Próximas confirmadas"],
  ["cancelled", "cancelled", "Canceladas"],
];

const TIME_FORMAT = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
} as const;

const SHORT_EVENT_MINUTES = 30;

/* ==========================================
   UTILIDADES
========================================== */

const pad = (n: number) => String(n).padStart(2, "0");

/** Fecha local con offset. No usa toISOString() para no mover el día a UTC. */
function formatLocalDateTime(d: Date): string {
  const offset = -d.getTimezoneOffset();
  const abs = Math.abs(offset);

  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${offset >= 0 ? "+" : "-"}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

const getAppointment = (extendedProps: Record<string, unknown>) =>
  extendedProps.appointment as Appointment;

const isShortEvent = (start: Date | null, end: Date | null) =>
  !!start && !!end
    ? (end.getTime() - start.getTime()) / 60000 <= SHORT_EVENT_MINUTES
    : true;

const statusVars = (key: StatusKey) => {
  const { bg, fg, accent } = STATUS[key];

  return {
    "--appt-bg": bg,
    "--appt-fg": fg,
    "--appt-accent": accent,
  } as CSSProperties;
};

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

/* ==========================================
   CONTENIDO DE EVENTOS
========================================== */

function renderEventContent({
  event,
  timeText,
}: {
  event: {
    extendedProps: Record<string, unknown>;
    start: Date | null;
    end: Date | null;
  };
  timeText: string;
}) {
  const appointment = getAppointment(event.extendedProps);
  const key = getStatusKey(appointment.status);

  return (
    <div
      className={`appt appt-${key}${
        isShortEvent(event.start, event.end) ? " appt--short" : ""
      }`}
      style={statusVars(key)}
    >
      <span className="appt__patient">{appointment.patientName}</span>
      <span className="appt__time">{timeText}</span>
      <span className="appt__treatment">{appointment.treatment}</span>
    </div>
  );
}

/* ==========================================
   COMPONENTE
========================================== */

export default function AppointmentCalendar({
  appointments,
  stats,
  onMonthChange,
  onSelectAppointment,
  onSlotClick,
  onMoveAppointment,
  onNewAppointment,
}: Props) {
  const isMobile = useIsMobile();
  const calendarRef = useRef<CalendarInstance>(null);

  const [calendarTitle, setCalendarTitle] = useState("");
  const [activeView, setActiveView] = useState<CalendarView>("timeGridWeek");

  const api = () => calendarRef.current?.getApi();

  const events = useMemo(
    () =>
      appointments.map((appointment) => {
        const key = getStatusKey(appointment.status);
        const { bg, fg } = STATUS[key];

        return {
          id: String(appointment.id),
          title: `${appointment.patientName} · ${appointment.treatment}`,
          start: appointment.start,
          end: appointment.end,
          backgroundColor: bg,
          textColor: fg,
          editable: !LOCKED_STATUSES.includes(key),
          extendedProps: { appointment },
        };
      }),
    [appointments],
  );

  /* ---------- Vista según tamaño de pantalla ---------- */

  useEffect(() => {
    const calendar = api();
    const target: CalendarView = isMobile ? "timeGridDay" : "timeGridWeek";

    if (calendar && calendar.view.type !== target) {
      calendar.changeView(target);
    }
  }, [isMobile]);

  /* ---------- Handlers ---------- */

  const handleEventClick = (info: EventClickInfo) =>
    onSelectAppointment(getAppointment(info.event.extendedProps));

  const handleDateClick = (info: DateClickInfo) =>
    onSlotClick(info.dateStr, info.allDay);

  const handleMove = async (info: EventMoveInfo) => {
    const appointment = getAppointment(info.event.extendedProps);
    const start = info.event.start;

    if (!start) {
      info.revert();
      return;
    }

    const duration =
      new Date(appointment.end).getTime() -
      new Date(appointment.start).getTime();

    const end = info.event.end ?? new Date(start.getTime() + duration);

    try {
      const ok = await onMoveAppointment(appointment, {
        start: start.toISOString(),
        end: end.toISOString(),
      });

      if (!ok) info.revert();
    } catch (error) {
      console.error("Error al actualizar la cita:", error);
      info.revert();
    }
  };

  /* El rango que reporta FullCalendar tiene el fin exclusivo. */
  const handleDatesSet = (info: DatesSetInfo) => {
    setCalendarTitle(info.view.title.toLocaleUpperCase("es-MX"));
    setActiveView(info.view.type as CalendarView);
    onMonthChange(
      formatLocalDateTime(info.start),
      formatLocalDateTime(info.end),
    );
  };

  /* ==========================================
     RENDER
  ========================================== */

  return (
    <section className="appointment-calendar" aria-label="Calendario de citas">
      <header className="appt-header">
        <div>
          <h1 className="appt-header__title">Agenda de citas</h1>
          <p className="appt-header__hint">
            Arrastra una cita para moverla o haz clic en un espacio libre
            para crear una nueva.
          </p>
        </div>

        <button
          type="button"
          className="appt-new-btn"
          onClick={onNewAppointment}
        >
          <span aria-hidden="true">+</span>
          Nueva cita
        </button>
      </header>

      <div className="appt-stats">
        {STAT_CARDS.map(([field, modifier, label]) => (
          <div key={field} className={`appt-stat appt-stat--${modifier}`}>
            <span className="appt-stat__label">{label}</span>
            <span className="appt-stat__value">{stats[field]}</span>
          </div>
        ))}
      </div>

      <div className="appointment-calendar__card">
        <div className="calendar-toolbar">
          <div className="calendar-toolbar__navigation">
            <button
              type="button"
              className="calendar-toolbar__arrow"
              onClick={() => api()?.prev()}
              aria-label="Periodo anterior"
              title="Periodo anterior"
            >
              ‹
            </button>

            <button
              type="button"
              className="calendar-toolbar__arrow"
              onClick={() => api()?.next()}
              aria-label="Periodo siguiente"
              title="Periodo siguiente"
            >
              ›
            </button>

            <button
              type="button"
              className="calendar-toolbar__today"
              onClick={() => api()?.today()}
            >
              Hoy
            </button>
          </div>

          <h2 className="calendar-toolbar__title">
            {calendarTitle || "AGENDA"}
          </h2>

          <div className="calendar-toolbar__views">
            {VIEWS.map(([view, label]) => (
              <button
                key={view}
                type="button"
                className={`calendar-toolbar__view ${
                  activeView === view ? "is-active" : ""
                }`}
                aria-pressed={activeView === view}
                onClick={() => api()?.changeView(view)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <FullCalendar
          ref={calendarRef}
          plugins={[
            themePlugin,
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          locale={esLocale}
          initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
          headerToolbar={false}
          height="100%"
          expandRows
          events={events}
          datesSet={handleDatesSet}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          editable
          eventDrop={handleMove}
          eventResize={handleMove}
          eventTimeFormat={TIME_FORMAT}
          slotHeaderFormat={TIME_FORMAT}
          nowIndicator
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          snapDuration="00:15:00"
          scrollTime="08:00:00"
          dayMaxEvents={isMobile ? 2 : 4}
          moreLinkContent={(arg) => `+${arg.num} más`}
          columnEventClass={({ event }) =>
            isShortEvent(event.start, event.end)
              ? "gc-col-event gc-col-event--short"
              : "gc-col-event"
          }
          rowEventClass="gc-row-event"
          listItemEventClass="gc-list-event"
          moreLinkClass="gc-more-link"
          slotLaneClass="gc-slot-lane"
          slotHeaderClass="gc-slot-label"
          dayHeaderClass="gc-day-header"
          dayCellClass={({ isToday, date }) =>
            [
              "gc-day-cell",
              isToday && "gc-day-cell--today",
              [0, 6].includes(date.getDay()) && "gc-day-cell--weekend",
            ]
              .filter(Boolean)
              .join(" ")
          }
          dayHeaderContent={(arg) => {
            if (arg.view.type === "dayGridMonth") return arg.text.toUpperCase();

            const dow = arg.date
              .toLocaleDateString("es-MX", { weekday: "short" })
              .replace(".", "")
              .toUpperCase();

            return (
              <span className={`gc-dh ${arg.isToday ? "gc-dh--today" : ""}`}>
                <span className="gc-dh__dow">{dow}</span>
                <span className="gc-dh__num">{arg.date.getDate()}</span>
              </span>
            );
          }}
          noEventsText="No hay citas en este periodo"
        />
      </div>
    </section>
  );
}