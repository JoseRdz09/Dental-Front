
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  LoaderCircle,
  Copy,
  Check,
} from "lucide-react";

import { updateClinicTeamMember } from "../services/clinicTeamServices";

import {
  CLINIC_TEAM_ROLES,
} from "../types/clinicTeam";

import type {
  ClinicTeamRole,
  ClinicTeamEditModalProps,
} from "../types/clinicTeam";

import "../css/ClinicTeamModal.css";

const ROLE_LABELS: Record<ClinicTeamRole, string> = {
  dentist: "Odontólogo",
  assistant: "Asistente dental",
  clinic_admin: "Recepcionista",
  cashier: "Cajero",
};

export default function ClinicTeamEditModal({
  clinicId,
  member,
  onClose,
  onSaved,
}: ClinicTeamEditModalProps) {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [role, setRole] = useState<ClinicTeamRole>(member.role);

  const [generatePassword, setGeneratePassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const showingTemporaryPassword = Boolean(temporaryPassword);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        !loading &&
        !showingTemporaryPassword
      ) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [loading, showingTemporaryPassword, onClose]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccessMessage("");
    setTemporaryPassword("");
    setShowPassword(false);
    setCopied(false);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      setError("Completa el nombre y el correo electrónico.");
      return;
    }

    setLoading(true);

    try {
      const data = await updateClinicTeamMember(
        clinicId,
        member.user_id,
        {
          name: normalizedName,
          email: normalizedEmail,
          role,
          generate_temporary_password: generatePassword,
        },
      );

      setSuccessMessage(
        data.message || "Integrante actualizado correctamente.",
      );

      if (data.temporary_password) {
        setTemporaryPassword(data.temporary_password);
        setShowPassword(false);
        setCopied(false);
        return;
      }

      onSaved();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el integrante.",
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
    onSaved();
    onClose();
  }

  return (
    <div
      className="clinic-team-modal__overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading &&
          !showingTemporaryPassword
        ) {
          onClose();
        }
      }}
    >
      <section
        className="clinic-team-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clinic-team-modal-title"
      >
        <header className="clinic-team-modal__header">
          <div>
            <h2 id="clinic-team-modal-title">
              {showingTemporaryPassword
                ? "Contraseña temporal generada"
                : "Editar integrante"}
            </h2>

            <p>
              {showingTemporaryPassword
                ? "Guarda la contraseña antes de finalizar."
                : "Actualiza los datos del equipo clínico."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading || showingTemporaryPassword}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </header>

        {showingTemporaryPassword ? (
          <div className="clinic-team-modal__success">
            <KeyRound size={28} />

            <p role="status">{successMessage}</p>

            <p>
              Guarda esta contraseña ahora. No se volverá a mostrar
              después de cerrar el modal. Compártela mediante un canal
              seguro y solicita que se cambie al iniciar sesión.
            </p>

            <label htmlFor="temporary-password">
              Contraseña temporal
            </label>

            <div className="clinic-team-modal__password">
              <input
                id="temporary-password"
                type={showPassword ? "text" : "password"}
                value={temporaryPassword}
                readOnly
                autoComplete="new-password"
                spellCheck={false}
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyPassword}
            >
              {copied ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}
              {copied
                ? "Contraseña copiada"
                : "Copiar contraseña"}
            </button>

            {error && (
              <p className="clinic-team-modal__error" role="alert">
                {error}
              </p>
            )}

            <button type="button" onClick={handleFinish}>
              Finalizar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="clinic-team-member-name">
              Nombre completo
              <input
                id="clinic-team-member-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
                maxLength={255}
                disabled={loading}
              />
            </label>

            <label htmlFor="clinic-team-member-email">
              Correo electrónico
              <input
                id="clinic-team-member-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                maxLength={255}
                disabled={loading}
              />
            </label>

            <label htmlFor="clinic-team-member-role">
              Rol en la clínica
              <select
                id="clinic-team-member-role"
                value={role}
                onChange={(event) => {
                  const selectedRole = CLINIC_TEAM_ROLES.find(
                    (item) => item === event.target.value,
                  );

                  if (selectedRole) {
                    setRole(selectedRole);
                  }
                }}
                required
                disabled={loading}
              >
                {CLINIC_TEAM_ROLES.map((item) => (
                  <option key={item} value={item}>
                    {ROLE_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>

            <label className="clinic-team-modal__checkbox">
              <input
                type="checkbox"
                checked={generatePassword}
                onChange={(event) =>
                  setGeneratePassword(event.target.checked)
                }
                disabled={loading}
              />

              <span>
                Generar contraseña temporal
                <small>
                  El usuario deberá cambiarla en su siguiente inicio
                  de sesión si el backend aplica esa política.
                </small>
              </span>
            </label>

            {error && (
              <p className="clinic-team-modal__error" role="alert">
                {error}
              </p>
            )}

            <footer className="clinic-team-modal__actions">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>

              <button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderCircle size={16} />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
