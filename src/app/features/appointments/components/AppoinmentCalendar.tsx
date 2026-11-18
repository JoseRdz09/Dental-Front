
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

import "../css/appointments-calendar.css";

// ============================================
// TIPOS
// ============================================

type CalendarProps = ComponentProps<typeof FullCalendar>;

type CalendarInstance = ComponentRef<typeof FullCalendar>;

type DateClickInfo = Parameters<
  NonNullable<CalendarProps["dateClick"]>
>[0];

type EventClickInfo = Parameters<
  NonNullable<CalendarProps["eventClick"]>
>[0];

type EventMoveInfo =
  | Parameters<NonNullable<CalendarProps["eventDrop"]>>[0]
  | Parameters<NonNullable<CalendarProps["eventResize"]>>[0];

type EventContentInfo = {
  event: {
    extendedProps: Record<string, unknown>;
    start: Date | null;
    end: Date | null;
  };
  timeText: string;
};

type CalendarView =
  | "dayGridMonth"
  | "timeGridWeek"
  | "timeGridDay"
  | "listWeek";

interface Props {
  appointments: Appointment[];

  onSelectAppointment: (appointment: Appointment) => void;

  onSlotClick: (dateStr: string, allDay: boolean) => void;

  onMoveAppointment: (
    appointment: Appointment,
    range: {
      start: string;
      end: string;
    },
  ) => Promise<boolean> | boolean;

  onNewAppointment: () => void;
}

// ============================================
// ESTILOS DE ESTADOS
// ============================================

function statusVars(key: StatusKey): CSSProperties {
  const status = STATUS[key];

  return {
    "--appt-bg": status.bg,
    "--appt-fg": status.fg,
    "--appt-accent": status.accent,
  } as CSSProperties;
}

// ============================================
// DETECTAR DISPOSITIVO MÓVIL
// ============================================

function useIsMobile(breakpoint = 700) {
  const query = `(max-width: ${breakpoint}px)`;

  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, [query]);

  return isMobile;
}

// ============================================
// CONTENIDO PERSONALIZADO DE LOS EVENTOS
// ============================================

function renderEventContent({
  event,
  timeText,
}: EventContentInfo) {
  const appointment = event.extendedProps
    .appointment as Appointment;

  const key = getStatusKey(appointment.status);

  const minutes =
    event.start && event.end
      ? (event.end.getTime() - event.start.getTime()) / 60000
      : 30;

  const short = minutes <= 30;

  return (
    <div
      className={`appt appt-${key}${
        short ? " appt--short" : ""
      }`}
      style={statusVars(key)}
    >
      <span className="appt__patient">
        {appointment.patientName}
      </span>

      <span className="appt__time">
        {timeText}
      </span>

      <span className="appt__treatment">
        {appointment.treatment}
      </span>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AppointmentCalendar({
  appointments,
  onSelectAppointment,
  onSlotClick,
  onMoveAppointment,
  onNewAppointment,
}: Props) {
  const isMobile = useIsMobile();

  const calendarRef = useRef<CalendarInstance>(null);

  

  const [calendarTitle, setCalendarTitle] = useState("");

  const [activeView, setActiveView] =
    useState<CalendarView>("timeGridWeek");

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  

  const stats = useMemo(() => {
    const now = new Date();

    const todayStr = now.toDateString();

    const today = appointments.filter(
      (appointment) =>
        new Date(appointment.start).toDateString() === todayStr &&
        getStatusKey(appointment.status) !== "cancelada",
    ).length;

    const toConfirm = appointments.filter(
      (appointment) =>
        getStatusKey(appointment.status) === "pendiente",
    ).length;

    const upcoming = appointments.filter(
      (appointment) =>
        getStatusKey(appointment.status) === "confirmada" &&
        new Date(appointment.start) >= now,
    ).length;

    const cancel = appointments.filter(
      (appointment) =>
        getStatusKey(appointment.status) === "cancelada",
    ).length;

    return {
      today,
      toConfirm,
      upcoming,
      cancel,
    };
  }, [appointments]);

  // ============================================
  // EVENTOS DEL CALENDARIO
  // ============================================

  const events = useMemo(
    () =>
      appointments 
        .map((appointment) => {
          const statusKey = getStatusKey(appointment.status);

          const style = STATUS[statusKey];

          return {
            id: String(appointment.id),

            title: `${appointment.patientName} · ${appointment.treatment}`,

            start: appointment.start,

            end: appointment.end,

            backgroundColor: style.bg,

            textColor: style.fg,

            editable: !LOCKED_STATUSES.includes(statusKey),

            extendedProps: {
              appointment,
            },
          };
        }),
    [appointments],
  );

  // ============================================
  // FILTROS
  // ============================================


  // ============================================
  // SELECCIONAR CITA
  // ============================================

  const handleEventClick = (info: EventClickInfo) => {
    const appointment = info.event.extendedProps
      .appointment as Appointment;

    onSelectAppointment(appointment);
  };

  // ============================================
  // SELECCIONAR HORARIO
  // ============================================

  const handleDateClick = (info: DateClickInfo) => {
    onSlotClick(info.dateStr, info.allDay);
  };

  // ============================================
  // MOVER O REDIMENSIONAR CITA
  // ============================================

  const handleMove = async (info: EventMoveInfo) => {
    const appointment = info.event.extendedProps
      .appointment as Appointment;

    const startDate = info.event.start;

    if (!startDate) {
      info.revert();
      return;
    }

    const originalDuration =
      new Date(appointment.end).getTime() -
      new Date(appointment.start).getTime();

    const endDate =
      info.event.end ??
      new Date(startDate.getTime() + originalDuration);

    const range = {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };

    try {
      const success = await onMoveAppointment(
        appointment,
        range,
      );

      if (!success) {
        info.revert();
      }
    } catch (error) {
      console.error("Error al actualizar la cita:", error);

      info.revert();
    }
  };

  // ============================================
  // ACTUALIZAR TÍTULO Y VISTA
  // ============================================

  const handleDatesSet = (info: {
    view: {
      title: string;
      type: string;
    };
  }) => {
    setCalendarTitle(
      info.view.title.toLocaleUpperCase("es-MX"),
    );

    setActiveView(info.view.type as CalendarView);
  };

  // ============================================
  // CAMBIAR VISTA AL CAMBIAR TAMAÑO DE PANTALLA
  // ============================================

  useEffect(() => {
    const calendar = calendarRef.current?.getApi();

    if (!calendar) return;

    calendar.changeView(
      isMobile ? "timeGridDay" : "timeGridWeek",
    );
  }, [isMobile]);

  // ============================================
  // NAVEGACIÓN
  // ============================================

  const goToPrevious = () => {
    calendarRef.current?.getApi().prev();
  };

  const goToNext = () => {
    calendarRef.current?.getApi().next();
  };

  const goToToday = () => {
    calendarRef.current?.getApi().today();
  };

  // ============================================
  // CAMBIAR ENTRE VISTAS
  // ============================================

  const changeCalendarView = (view: CalendarView) => {
    calendarRef.current?.getApi().changeView(view);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <section
      className="appointment-calendar"
      aria-label="Calendario de citas"
    >
      {/* ENCABEZADO */}

      <header className="appt-header">
        <div>
          <h1 className="appt-header__title">
            Agenda de citas
          </h1>

          <p className="appt-header__hint">
            Arrastra una cita para moverla o haz clic en un
            espacio libre para crear una nueva.
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

      {/* ESTADÍSTICAS */}

      <div className="appt-stats">
        <div className="appt-stat appt-stat--today">
          <span className="appt-stat__label">Citas hoy</span>
          <span className="appt-stat__value">{stats.today}</span>
        </div>

        <div className="appt-stat appt-stat--pending">
          <span className="appt-stat__label">Por confirmar</span>
          <span className="appt-stat__value">{stats.toConfirm}</span>
        </div>

        <div className="appt-stat appt-stat--confirmed">
          <span className="appt-stat__label">Próximas confirmadas</span>
          <span className="appt-stat__value">{stats.upcoming}</span>
        </div>

        <div className="appt-stat appt-stat--cancelled">
          <span className="appt-stat__label">Canceladas</span>
          <span className="appt-stat__value">{stats.cancel}</span>
        </div>
      </div>

      {/* CALENDARIO */}

      <div className="appointment-calendar__card">

        {/* BARRA PERSONALIZADA */}

        <div className="calendar-toolbar">

          <div className="calendar-toolbar__navigation">
            <button
              type="button"
              className="calendar-toolbar__arrow"
              onClick={goToPrevious}
              aria-label="Periodo anterior"
              title="Periodo anterior"
            >
              ‹
            </button>

            <button
              type="button"
              className="calendar-toolbar__arrow"
              onClick={goToNext}
              aria-label="Periodo siguiente"
              title="Periodo siguiente"
            >
              ›
            </button>

            <button
              type="button"
              className="calendar-toolbar__today"
              onClick={goToToday}
            >
              Hoy
            </button>
          </div>

          <h2 className="calendar-toolbar__title">
            {calendarTitle || "AGENDA"}
          </h2>

          <div className="calendar-toolbar__views">

            {(
              [
                ["dayGridMonth", "Mes"],
                ["timeGridWeek", "Semana"],
                ["timeGridDay", "Día"],
                ["listWeek", "Agenda"],
              ] as const
            ).map(([view, label]) => (
              <button
                key={view}
                type="button"
                className={`calendar-toolbar__view ${
                  activeView === view ? "is-active" : ""
                }`}
                aria-pressed={activeView === view}
                onClick={() => changeCalendarView(view)}
              >
                {label}
              </button>
            ))}

          </div>
        </div>

        {/* FULLCALENDAR */}

        <FullCalendar
          ref={calendarRef}

          timeZone="local"

          plugins={[
            themePlugin,
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}

          locale={esLocale}

          initialView={
            isMobile ? "timeGridDay" : "timeGridWeek"
          }

          headerToolbar={false}
          footerToolbar={false}

          height="100%"
          contentHeight="100%"
          expandRows={true}

          datesSet={handleDatesSet}

          firstDay={1}

          events={events}

          eventContent={renderEventContent}

          eventClick={handleEventClick}

          dateClick={handleDateClick}

          editable={true}

          eventStartEditable={true}

          eventDurationEditable={true}

          eventDrop={handleMove}

          eventResize={handleMove}

          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}

          slotHeaderFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}

          nowIndicator={true}

          allDaySlot={false}

          slotMinTime="08:00:00"

          slotMaxTime="20:00:00"

          slotDuration="00:30:00"

          snapDuration="00:15:00"

          scrollTime="08:00:00"

          dayMaxEvents={isMobile ? 2 : 4}

          moreLinkContent={(arg) =>
            `+${arg.num} más`
          }

          slotEventOverlap={true}

          columnEventClass={({ event }) => {
            const minutes =
              event.start && event.end
                ? (event.end.getTime() -
                    event.start.getTime()) /
                  60000
                : 30;

            return minutes <= 30
              ? "gc-col-event gc-col-event--short"
              : "gc-col-event";
          }}

          rowEventClass="gc-row-event"

          listItemEventClass="gc-list-event"

          moreLinkClass="gc-more-link"

          slotLaneClass="gc-slot-lane"

          slotHeaderClass="gc-slot-label"

          dayHeaderClass="gc-day-header"

          dayCellClass={({ isToday, date }) => {
            const weekend =
              date.getDay() === 0 ||
              date.getDay() === 6;

            return [
              "gc-day-cell",
              isToday ? "gc-day-cell--today" : "",
              weekend ? "gc-day-cell--weekend" : "",
            ]
              .filter(Boolean)
              .join(" ");
          }}

          dayHeaderContent={(arg) => {
            if (arg.view.type === "dayGridMonth") {
              return arg.text.toUpperCase();
            }

            const dow = arg.date
              .toLocaleDateString("es-MX", {
                weekday: "short",
              })
              .replace(".", "");

            return (
              <span
                className={`gc-dh ${
                  arg.isToday ? "gc-dh--today" : ""
                }`}
              >
                <span className="gc-dh__dow">
                  {dow.toUpperCase()}
                </span>

                <span className="gc-dh__num">
                  {arg.date.getDate()}
                </span>
              </span>
            );
          }}

          noEventsText="No hay citas en este periodo"
        />
      </div>
    </section>
  );
}
