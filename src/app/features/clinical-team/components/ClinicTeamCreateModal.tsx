
import { useState } from "react";
import type { FormEvent } from "react";
import {
  X,
  UserPlus,
  LoaderCircle,
  Copy,
  Check,
} from "lucide-react";

import { createClinicTeamMember } from "../services/clinicTeamServices";

import {
  CLINIC_TEAM_ROLES,
} from "../types/clinicTeam";

import type {
  ClinicTeamRole,
  ClinicTeamCreateModalProps,
} from "../types/clinicTeam";

import "../css/ClinicTeamCreateModal.css";

const ROLE_LABELS: Record<ClinicTeamRole, string> = {
  dentist: "Odontólogo",
  assistant: "Asistente dental",
  clinic_admin: "Recepcionista",
  cashier: "Cajero",
};

export default function ClinicTeamCreateModal({
  clinicId,
  onClose,
  onCreated,
}: ClinicTeamCreateModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ClinicTeamRole>("dentist");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccessMessage("");
    setTemporaryPassword("");
    setCopied(false);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      setError("Completa el nombre y el correo electrónico.");
      return;
    }

    setLoading(true);

    try {
      const data = await createClinicTeamMember(clinicId, {
        name: normalizedName,
        email: normalizedEmail,
        role,
      });

      setSuccessMessage(
        data.message || "Integrante creado correctamente.",
      );

      if (data.temporary_password) {
        setTemporaryPassword(data.temporary_password);
      } else {
        onCreated();
      }
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyPassword() {
    if (!temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setError("");
    } catch {
      setCopied(false);
      setError("No se pudo copiar la contraseña.");
    }
  }

  function handleFinish() {
    onCreated();
  }

  return (
    <div
      className="clinic-team-create-modal__overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading &&
          !temporaryPassword
        ) {
          onClose();
        }
      }}
    >
      <section
        className="clinic-team-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clinic-team-create-title"
      >
        <header className="clinic-team-create-modal__header">
          <div className="clinic-team-create-modal__heading">
            <span className="clinic-team-create-modal__icon">
              <UserPlus size={21} />
            </span>

            <div>
              <h2 id="clinic-team-create-title">
                Agregar integrante
              </h2>
              <p>
                Registra un nuevo integrante del equipo clínico.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="clinic-team-create-modal__close"
            onClick={onClose}
            disabled={loading || Boolean(temporaryPassword)}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </header>

        {temporaryPassword ? (
          <div className="clinic-team-create-modal__result">
            <h3>Integrante creado</h3>

            <p role="status">{successMessage}</p>

            <p>
              Comparte la contraseña mediante un canal seguro y
              solicita que se cambie al iniciar sesión.
            </p>

            <label htmlFor="temporary-password">
              Contraseña temporal
            </label>

            <div className="clinic-team-create-modal__password">
              <input
                id="temporary-password"
                type="text"
                readOnly
                value={temporaryPassword}
                autoComplete="off"
                spellCheck={false}
              />

              <button
                type="button"
                onClick={handleCopyPassword}
                aria-label="Copiar contraseña temporal"
              >
                {copied ? (
                  <Check size={18} />
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>

            {copied && (
              <p role="status">Contraseña copiada.</p>
            )}

            {error && (
              <div
                className="clinic-team-create-modal__error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              className="clinic-team-create-modal__submit"
              onClick={handleFinish}
            >
              Finalizar
            </button>
          </div>
        ) : (
          <form
            className="clinic-team-create-modal__form"
            onSubmit={handleSubmit}
          >
            {error && (
              <div
                className="clinic-team-create-modal__error"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="clinic-team-create-modal__field">
              <label htmlFor="team-member-name">
                Nombre completo
              </label>

              <input
                id="team-member-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Ana García"
                maxLength={255}
                autoComplete="name"
                required
                disabled={loading}
              />
            </div>

            <div className="clinic-team-create-modal__field">
              <label htmlFor="team-member-email">
                Correo electrónico
              </label>

              <input
                id="team-member-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ana@clinica.com"
                maxLength={255}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div className="clinic-team-create-modal__field">
              <label htmlFor="team-member-role">
                Rol en la clínica
              </label>

              <select
                id="team-member-role"
                value={role}
                onChange={(event) => {
                  const selectedRole = CLINIC_TEAM_ROLES.find(
                    (item) => item === event.target.value,
                  );

                  if (selectedRole) {
                    setRole(selectedRole);
                  }
                }}
                disabled={loading}
              >
                {CLINIC_TEAM_ROLES.map((item) => (
                  <option key={item} value={item}>
                    {ROLE_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>

            <footer className="clinic-team-create-modal__footer">
              <button
                type="button"
                className="clinic-team-create-modal__cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="clinic-team-create-modal__submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="clinic-team-create-modal__spinner"
                    />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus size={17} />
                    Crear integrante
                  </>
                )}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
