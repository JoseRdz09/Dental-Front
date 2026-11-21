
import type {
  ClinicTeamMember,
  ClinicTeamTableProps,
} from "../types/clinicTeam";
import {Pencil, Trash2 } from "lucide-react";

import "../css/ClinicTeamTable.css";

const ROLE_LABELS: Record<ClinicTeamMember["role"], string> = {
  dentist: "Odontólogo",
  assistant: "Asistente dental",
  clinic_admin: "Recepcionista",
  cashier: "Cajero",
};

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function getInitial(name: string | null | undefined): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

export default function ClinicTeamTable({
  members,
  loading,
  error,
  clinicId,
  onReload,
  onEdit,
  onDelete,
}: ClinicTeamTableProps) {
  return (
    <section className="clinic-team">
      <header className="clinic-team__header">
        <div>
          <h1>Equipo clínico</h1>
          <p>Administra los integrantes de tu clínica.</p>
        </div>
      </header>

      {clinicId === null ? (
        <div className="clinic-team__state">
          Selecciona una clínica para consultar a sus integrantes.
        </div>
      ) : loading ? (
        <div className="clinic-team__state" role="status">
          Cargando equipo clínico...
        </div>
      ) : error ? (
        <div className="clinic-team__error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={onReload}>
            Reintentar
          </button>
        </div>
      ) : (
        <div className="clinic-team__table-wrapper">
          <table className="clinic-team__table">
            <thead>
              <tr>
                <th scope="col">Profesional</th>
                <th scope="col">Correo electrónico</th>
                <th scope="col">Rol</th>
                <th scope="col">Fecha de incorporación</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="clinic-team__empty">
                    <div className="clinic-team__empty-content">
                      <strong>No hay integrantes registrados en esta clínica.</strong>
                      <span>
                        Cuando agregues integrantes, aparecerán aquí.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={`${member.clinic_id}-${member.user_id}`}>
                    <td>
                      <div className="clinic-team__person">
                        <span
                          className="clinic-team__avatar"
                          aria-hidden="true"
                        >
                          {getInitial(member.name)}
                        </span>
                        <strong>{member.name}</strong>
                      </div>
                    </td>

                    <td>{member.email}</td>

                    <td>
                      <span className="clinic-team__role">
                        {ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    </td>

                    <td>{formatDate(member.created_at)}</td>

                    <td>
                      <div className="clinic-team__actions">
                        <button
                          type="button"
                          className="clinic-team__edit-button"
                          onClick={() => onEdit(member)}
                          aria-label={`Editar a ${member.name}`}
                        >
                         <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="clinic-team__delete-button"
                          onClick={() => onDelete(member)}
                          aria-label={`Eliminar a ${member.name}`}
                        >
                         <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
