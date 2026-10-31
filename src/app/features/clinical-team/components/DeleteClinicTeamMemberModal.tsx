import type { DeleteClinicTeamMemberModalProps } from "../types/clinicTeam";

import "../css/DeleteClinicTeamMemberModal.css";

export default function DeleteClinicTeamMemberModal({
  memberName,
  loading,
  onClose,
  onConfirm,
}: DeleteClinicTeamMemberModalProps) {
  return (
    <div
      className="delete-team-modal__overlay"
      onClick={loading ? undefined : onClose}
    >
      <section
        className="delete-team-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-team-modal-title"
        aria-describedby="delete-team-modal-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-team-modal-title">
          Eliminar integrante
        </h2>

        <p id="delete-team-modal-description">
          ¿Estás seguro de que deseas eliminar a{" "}
          <strong>{memberName}</strong> del equipo clínico?
        </p>

        <p className="delete-team-modal__warning">
          Esta acción no se puede deshacer fácilmente.
        </p>

        <div className="delete-team-modal__actions">
          <button
            type="button"
            className="delete-team-modal__cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="delete-team-modal__confirm"
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </section>
    </div>
  );
}