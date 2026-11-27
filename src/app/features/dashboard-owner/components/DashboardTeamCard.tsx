
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
          {clinics.map((clinic) => {
            const memberCount = team.filter(
              (member) => member.clinic_id === clinic.id
            ).length;

            return (
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
                    {memberCount} integrantes registrados
                  </span>
                </div>
              </div>
            );
          })}

          {clinics.length === 0 && (
            <p className="dashboard-team-card__empty">
              No hay clínicas registradas.
            </p>
          )}
        </div>
      ) : (
        <div className="dashboard-team-card__members">
          {team
            .filter((member) => member.clinic_id === clinicId)
            .map((member) => (
              <div
                className="dashboard-team-card__member"
                key={`${member.id}-${member.clinic_id}`}
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
              </div>
            ))}

          {team.filter(
            (member) => member.clinic_id === clinicId
          ).length === 0 && (
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
