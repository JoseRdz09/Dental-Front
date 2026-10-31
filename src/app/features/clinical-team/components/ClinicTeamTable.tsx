import type { ReactNode } from "react";

import type {
  ClinicTeamMember,
  ClinicTeamTableProps,
} from "../types/clinicTeam";

import "../css/ClinicTeamPage.css";

const ROLE_LABELS: Record<ClinicTeamMember["role"], string> = {
  dentist: "Odontólogo",
  assistant: "Asistente dental",
  clinic_admin: "Recepcionista",
  cashier: "Cajero",
};

function formatDate(date: string | null | undefined): string {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

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
  total,
  loading,
  error,
  clinicId,
  onReload,
  onEdit,
  onDelete,
}: ClinicTeamTableProps) {
  let content: ReactNode;

  if (clinicId === null) {
    content = (
      <div className="clinic-team__state">
        Selecciona una clínica para consultar a sus integrantes.
      </div>
    );
  } else if (loading) {
    content = (
      <div className="clinic-team__state" role="status">
        Cargando equipo clínico...
      </div>
    );
  } else if (error) {
    content = (
      <div className="clinic-team__error" role="alert">
        <p>{error}</p>

        <button type="button" onClick={onReload}>
          Reintentar
        </button>
      </div>
    );
  } else if (members.length === 0) {
    content = (
      <div className="clinic-team__state">
        No hay integrantes registrados en esta clínica.
      </div>
    );
  } else {
    content = (
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
            {members.map((member) => (
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
                      title="Editar integrante"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="clinic-team__delete-button"
                      onClick={() => onDelete(member)}
                      aria-label={`Eliminar a ${member.name}`}
                      title="Eliminar integrante"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="clinic-team">
      <header className="clinic-team__header">
        <div>
          <h2>Equipo clínico</h2>

          <p>
            Administra y consulta a los profesionales que pertenecen
            a la clínica.
          </p>

          {clinicId !== null && !loading && !error && (
            <p className="clinic-team__count">
              {total} {total === 1 ? "integrante" : "integrantes"}
            </p>
          )}
        </div>
      </header>

      {content}
    </section>
  );
}
