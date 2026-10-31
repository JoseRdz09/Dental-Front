
import "../css/PatientModal.css";

interface Props {
  patientName: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeletePatientModal({
  patientName,
  loading,
  onClose,
  onConfirm,
}: Props) {
  return (
    <div
      className="patient-modal__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <section
        className="patient-modal patient-modal--confirmation"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-patient-title"
      >
        <header className="patient-modal__header">
          <div>
            <h2 id="delete-patient-title">Eliminar paciente</h2>
            <p>Esta acción no se puede deshacer.</p>
          </div>
        </header>

        <div className="patient-modal__body">
          ¿Deseas eliminar a <strong>{patientName}</strong>?
        </div>

        <footer className="patient-modal__footer">
          <button
            type="button"
            className="patient-button patient-button--secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="patient-button patient-button--danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </footer>
      </section>
    </div>
  );
}
