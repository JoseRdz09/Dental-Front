
import "../css/DeleteClinicModal.css";

interface Props {
  clinicName: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteClinicModal({
  clinicName,
  deleting,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className="delete-clinic-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !deleting
        ) {
          onCancel();
        }
      }}
    >
      <section
        className="delete-clinic-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-clinic-title"
        aria-describedby="delete-clinic-description"
      >
        <div className="delete-clinic-icon" aria-hidden="true">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="m19 6-1 14H6L5 6" />
            <path d="M10 11v5" />
            <path d="M14 11v5" />
          </svg>
        </div>

        <h2 id="delete-clinic-title">
          ¿Eliminar esta clínica?
        </h2>

        <p className="delete-clinic-question">
          Estás a punto de eliminar la clínica:
        </p>

        <div className="delete-clinic-name">
          {clinicName}
        </div>

        <p
          id="delete-clinic-description"
          className="delete-clinic-warning"
        >
          Esta acción es irreversible. Una vez eliminada,
          no podrás recuperar esta clínica ni acceder a ella
          desde tu cuenta.
        </p>

        <footer className="delete-clinic-actions">
          <button
            type="button"
            className="delete-clinic-cancel"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="delete-clinic-confirm"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting
              ? "Eliminando..."
              : "Sí, eliminar clínica"}
          </button>
        </footer>
      </section>
    </div>
  );
}
