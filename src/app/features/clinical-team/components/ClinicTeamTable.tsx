import type { ReactNode } from "react";
import "../css/ClinicTeamPage.css";

interface ClinicTeamMember {
  clinic_id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface ClinicTeamTableProps {
  members: ClinicTeamMember[];
  total: number;
  loading: boolean;
  error: string | null;
  clinicId: number | null;
  onReload: () => void;
  onEdit: (member: ClinicTeamMember) => void;
}

const roleLabels: Record<string, string> = {
  clinic_admin: "Administrador de clínica",
  dentist: "Odontólogo",
  receptionist: "Recepcionista",
};

function formatDate(date: string): string {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export default function ClinicTeamTable({
  members,
  loading,
  error,
  clinicId,
  onReload,
  onEdit,
}: ClinicTeamTableProps) {
  let content: ReactNode;

  if (loading) {
    content = (
      <div className="clinic-team__state" role="status">
        Cargando equipo clínico...
      </div>
    );
  } else if (error) {
    content = (
      <div className="clinic-team__error" role="alert">
        <p>{error}</p>

        {clinicId && (
          <button
            type="button"
            onClick={onReload}
            disabled={loading}
          >
            Reintentar
          </button>
        )}
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
              <th>Profesional</th>
              <th>Correo electrónico</th>
              <th>Rol</th>
              <th>Fecha de incorporación</th>
            </tr>
          </thead>

          <tbody>
            {members.map((member) => (
                <tr key={`${member.clinic_id}-${member.user_id}`}>
                    <td>
                    <div className="clinic-team__person">
                        <span className="clinic-team__avatar">
                        {member.name.trim().charAt(0).toUpperCase()}
                        </span>

                        <strong>{member.name}</strong>
                    </div>
                    </td>

                    <td>{member.email}</td>

                    <td>
                    <span className="clinic-team__role">
                        {roleLabels[member.role] ?? member.role}
                    </span>
                    </td>

                    <td>{formatDate(member.created_at)}</td>

                    <td>
                    <button
                        type="button"
                        className="clinic-team__edit-button"
                        onClick={() => onEdit(member)}
                        aria-label={`Editar a ${member.name}`}
                        title="Editar integrante"
                    >
                        Editar
                    </button>
                    </td>
                </tr>
            ))}
            
          </tbody>
        </table>
        
      </div>
    );

    
  }

  return (
    <section >
      <header className="clinic-team__header">
        <div>
          
          <p>
            Administra y consulta a los profesionales
            que pertenecen a la clínica.
          </p>
        </div>
      </header>


      {content}
    </section>
    
  );
  
}