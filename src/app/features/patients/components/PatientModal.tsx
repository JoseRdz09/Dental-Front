
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Patient, PatientPayload, PatientFormData, } from "../types/patient";

import {
  emptyPatientForm,
  getPatientFormData,
  preparePatientPayload,
} from "../services/patientService";

import "../css/PatientModal.css";

type ModalMode = "create" | "view" | "edit";

interface Props {
  mode: ModalMode;
  patient: Patient | null;
  loading: boolean;
  onClose: () => void;
  onSave: (payload: PatientPayload) => void;
}

export default function PatientModal({
  mode,
  patient,
  loading,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<PatientFormData>({
    ...emptyPatientForm,
  });

  const readOnly = mode === "view";

  useEffect(() => {
    setForm(getPatientFormData(patient));
  }, [patient, mode]);

  function changeField(
    field: keyof PatientPayload,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (readOnly || loading) return;

    onSave(preparePatientPayload(form));
  }

  const title = {
    create: "Registrar paciente",
    view: "Información del paciente",
    edit: "Editar paciente",
  }[mode];

  return (
    <div
      className="patient-modal__overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <section
        className="patient-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-modal-title"
      >
        <header className="patient-modal__header">
          <div>
            <h2 id="patient-modal-title">{title}</h2>
            <p>Información general y datos de contacto.</p>
          </div>

          <button
            type="button"
            className="patient-modal__close"
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="patient-modal__body">
            <div className="patient-modal__grid">

              <label>
                Nombre *
                <input
                  value={form.first_name}
                  onChange={(e) =>
                    changeField("first_name", e.target.value)
                  }
                  disabled={readOnly || loading}
                  required
                />
              </label>

              <label>
                Apellidos *
                <input
                  value={form.last_name}
                  onChange={(e) =>
                    changeField("last_name", e.target.value)
                  }
                  disabled={readOnly || loading}
                  required
                />
              </label>

              <label>
                Número de celular *
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    changeField("phone", e.target.value.slice(0,13))
                  }
                  disabled={readOnly || loading}
                  maxLength={13}
                />
              </label>

              <label>
                Fecha de nacimiento
                <input
                  type="date"
                  value={form.birth_date ?? ""}
                  onChange={(e) =>
                    changeField("birth_date", e.target.value)
                  }
                  disabled={readOnly || loading}
                />
              </label>

              <label>
                Sexo
                <select
                  value={form.gender ?? ""}
                  onChange={(e) =>
                    changeField("gender", e.target.value)
                  }
                  disabled={readOnly || loading}
                >
                  <option value="Sin especificar">Sin especificar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </label>

              <label className="patient-modal__full">
                Dirección
                <input
                  value={form.address ?? ""}
                  onChange={(e) =>
                    changeField("address", e.target.value)
                  }
                  disabled={readOnly || loading}
                />
              </label>

              <label>
                Nombre de contacto de emergencia
                <input
                  value={form.emergency_contact_name ?? ""}
                  onChange={(e) =>
                    changeField(
                      "emergency_contact_name",
                      e.target.value
                    )
                  }
                  disabled={readOnly || loading}
                />
              </label>

              <label>
                Teléfono de emergencia
                <input
                  type="tel"
                  maxLength={13}
                  value={form.emergency_contact_phone ?? ""}
                  onChange={(e) =>
                    changeField(
                      "emergency_contact_phone",
                      e.target.value.slice(0,13)
                    )
                  }
                  disabled={readOnly || loading}
                />
              </label>

              <label>
                Estado
                <select
                  value={form.status ?? "active"}
                  onChange={(e) =>
                    changeField("status", e.target.value)
                  }
                  disabled={readOnly || loading}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </label>

              <label className="patient-modal__full">
                Notas
                <textarea
                  rows={3}
                  value={form.notes ?? ""}
                  onChange={(e) =>
                    changeField("notes", e.target.value)
                  }
                  disabled={readOnly || loading}
                />
              </label>

            </div>
          </div>

          <footer className="patient-modal__footer">
            <button
              type="button"
              className="patient-button patient-button--secondary"
              onClick={onClose}
              disabled={loading}
            >
              {readOnly ? "Cerrar" : "Cancelar"}
            </button>

            {!readOnly && (
              <button
                type="submit"
                className="patient-button patient-button--primary"
                disabled={loading}
              >
                {loading
                  ? "Guardando..."
                  : mode === "create"
                    ? "Registrar paciente"
                    : "Guardar cambios"}
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}
