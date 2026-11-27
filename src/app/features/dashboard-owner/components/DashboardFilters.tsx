
import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

import type { DashboardClinic } from "../types/dashboard";
import "../css/DashboardFilters.css";

interface Props {
  clinics: DashboardClinic[];
  clinicId: number | null;
  date: string;
  onClinicChange: (id: number | null) => void;
  onDateChange: (date: string) => void;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const pad = (value: number) => String(value).padStart(2, "0");

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const DashboardFilters = ({
  clinics,
  clinicId,
  date,
  onClinicChange,
  onDateChange,
}: Props) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedDate = parseDate(date);

  const [viewDate, setViewDate] = useState(
    () => new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    )
  );

  const today = formatDate(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const previousMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const selectDate = (day: number) => {
    const newDate = formatDate(new Date(year, month, day));
    onDateChange(newDate);
    setCalendarOpen(false);
  };

  const goToday = () => {
    const currentDate = new Date();
    onDateChange(formatDate(currentDate));
    setViewDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      )
    );
    setCalendarOpen(false);
  };

  return (
    <section className="dashboard-filters">

      {/* FILTRO DE CLÍNICA */}
      <div className="dashboard-filters__clinic">
        <label htmlFor="dashboard-clinic">
          Clínica
        </label>

        <div className="dashboard-filters__select">
          <select
            id="dashboard-clinic"
            value={clinicId ?? "all"}
            onChange={(e) =>
              onClinicChange(
                e.target.value === "all"
                  ? null
                  : Number(e.target.value)
              )
            }
          >
            <option value="all">Todas las clínicas</option>

            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>

          <ChevronDown size={17} />
        </div>
      </div>

      {/* FILTRO DE FECHA */}
      <div className="dashboard-filters__date-wrapper">

        <label>Fecha de consulta</label>

        <div className="dashboard-filters__date-container">

          <button
            type="button"
            className={`dashboard-date-trigger ${
              calendarOpen ? "is-open" : ""
            }`}
            onClick={() => setCalendarOpen(!calendarOpen)}
            aria-expanded={calendarOpen}
            aria-label="Seleccionar fecha"
          >
            <span className="dashboard-date-trigger__icon">
              <CalendarDays size={19} />
            </span>

            <span className="dashboard-date-trigger__content">
              <strong>
                {selectedDate.toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
              <small>
                {date === today ? "Hoy" : "Fecha seleccionada"}
              </small>
            </span>

            <ChevronDown
              size={17}
              className={`dashboard-date-trigger__chevron ${
                calendarOpen ? "rotated" : ""
              }`}
            />
          </button>

          {calendarOpen && (
            <>
              <button
                type="button"
                className="dashboard-calendar-backdrop"
                aria-label="Cerrar calendario"
                onClick={() => setCalendarOpen(false)}
              />

              <div className="dashboard-calendar">

                <div className="dashboard-calendar__header">
                  <div>
                    <span>CALENDARIO</span>
                    <h3>Seleccionar fecha</h3>
                  </div>

                  <button
                    type="button"
                    className="dashboard-calendar__today"
                    onClick={goToday}
                  >
                    <RotateCcw size={14} />
                    Hoy
                  </button>
                </div>

                <div className="dashboard-calendar__navigation">
                  <div>
                    <strong>{MONTHS[month]}</strong>
                    <span>{year}</span>
                  </div>

                  <div className="dashboard-calendar__arrows">
                    <button
                      type="button"
                      onClick={previousMonth}
                      aria-label="Mes anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={nextMonth}
                      aria-label="Mes siguiente"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="dashboard-calendar__grid">

                  {WEEKDAYS.map((day, index) => (
                    <div
                      key={index}
                      className="dashboard-calendar__weekday"
                    >
                      {day}
                    </div>
                  ))}

                  {Array.from(
                    { length: offset },
                    (_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="dashboard-calendar__empty"
                      />
                    )
                  )}

                  {Array.from(
                    { length: daysInMonth },
                    (_, index) => {
                      const day = index + 1;
                      const dayDate = formatDate(
                        new Date(year, month, day)
                      );

                      const isSelected = dayDate === date;
                      const isToday = dayDate === today;

                      return (
                        <button
                          key={day}
                          type="button"
                          className={`dashboard-calendar__day ${
                            isSelected ? "selected" : ""
                          } ${isToday ? "today" : ""}`}
                          onClick={() => selectDate(day)}
                          aria-pressed={isSelected}
                        >
                          {day}
                        </button>
                      );
                    }
                  )}

                </div>

                <div className="dashboard-calendar__footer">
                  <span>
                    Fecha seleccionada
                  </span>

                  <strong>
                    {selectedDate.toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                </div>

              </div>
            </>
          )}

        </div>
      </div>

    </section>
  );
};

export default DashboardFilters;
