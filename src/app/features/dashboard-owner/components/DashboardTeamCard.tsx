
import { Users, UserRound } from "lucide-react";

import type {
  DashboardClinic,
  DashboardTeamMember,
} from "../types/dashboard";

interface Props {
  clinicId: number | null;
  clinics: DashboardClinic[];
  team: DashboardTeamMember[];
}

const ROLE_LABELS: Record<DashboardTeamMember["role"], string> = {
  dentist: "Odontólogo",
  assistant: "Asistente",
  clinic_admin: "Recepcionista",
  cashier: "Cajero",
};

const DashboardTeamCard = ({
  clinicId,
  clinics,
  team,
}: Props) => {
  return (
    <article className="dashboard-team-card">
      <div className="dashboard-card__header">
        <div>
          <h2>Equipo de trabajo</h2>
          <p>
            {clinicId === null
              ? "Integrantes por clínica"
              : "Integrantes de esta clínica"}
          </p>
        </div>

        <div className="dashboard-team-card__icon">
          <Users size={21} />
        </div>
      </div>

      {clinicId === null ? (
        <div className="dashboard-team-card__clinics">
          {clinics.map((clinic) => (
            <div
              className="dashboard-team-card__clinic"
              key={clinic.id}
            >
              <div className="dashboard-team-card__clinic-icon">
                <UserRound size={18} />
              </div>

              <div>
                <strong>{clinic.name}</strong>
                <span>
                  {clinic.stats.activeTeamMembers} integrantes activos
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-team-card__members">
          {team.map((member) => (
            <div
              className="dashboard-team-card__member"
              key={member.id}
            >
              <div className="dashboard-team-card__avatar">
                {member.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>

              <div className="dashboard-team-card__member-info">
                <strong>{member.name}</strong>
                <span>{ROLE_LABELS[member.role]}</span>
              </div>

              <span
                className={`dashboard-team-card__status ${
                  member.isActive ? "is-active" : "is-inactive"
                }`}
              >
                {member.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>
          ))}

          {team.length === 0 && (
            <p className="dashboard-team-card__empty">
              No hay integrantes registrados en esta clínica.
            </p>
          )}
        </div>
      )}
    </article>
  );
};

export default DashboardTeamCard;
