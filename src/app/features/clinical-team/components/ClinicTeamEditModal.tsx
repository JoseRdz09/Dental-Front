
import { useEffect, useState } from "react";
import { X, KeyRound, Eye, EyeOff, LoaderCircle } from "lucide-react";
import type { FormEvent } from "react";
import "../css/ClinicTeamModal.css";

export interface ClinicTeamMember {
  clinic_id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface ClinicTeamModalProps {
  clinicId: number;
  member: ClinicTeamMember;
  onClose: () => void;
  onSaved: () => void;
}

export default function ClinicTeamEditModal({
  clinicId,
  member,
  onClose,
  onSaved,
}: ClinicTeamModalProps) {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [role, setRole] = useState(member.role);
  const [generatePassword, setGeneratePassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [loading, onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setTemporaryPassword("");

    try {
      // Conecta esta llamada con el servicio del frontend.
      const response = await fetch(
        `http://localhost:8000/api/clinics/${clinicId}/team/${member.user_id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": decodeURIComponent(
              document.cookie
                .split("; ")
                .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
                ?.split("=")
                .slice(1)
                .join("=") ?? ""
            ),
          },
          body: JSON.stringify({
            name,
            email,
            role,
            generate_temporary_password: generatePassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            Object.values(data.errors ?? {}).flat().join(" ") ??
            "No se pudo actualizar el usuario."
        );
      }

      if (data.temporary_password) {
        setTemporaryPassword(data.temporary_password);
        return;
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al actualizar el usuario."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(temporaryPassword);
  }

  return (
    <div
      className="clinic-team-modal__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
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
              {temporaryPassword
                ? "Contraseña temporal generada"
                : "Editar integrante"}
            </h2>
            <p>Actualiza los datos del equipo clínico.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </header>

        {temporaryPassword ? (
          <div className="clinic-team-modal__success">
            <KeyRound size={28} />
            <p>
              Guarda esta contraseña ahora. No se volverá a mostrar
              después de cerrar el modal.
            </p>

            <div className="clinic-team-modal__password">
              <input
                type={showPassword ? "text" : "password"}
                value={temporaryPassword}
                readOnly
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="button" onClick={() => void copyPassword()}>
              Copiar contraseña
            </button>

            <button
              type="button"
              onClick={() => {
                onSaved();
                onClose();
              }}
            >
              Finalizar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Nombre completo
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={255}
              />
            </label>

            <label>
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={255}
              />
            </label>

            <label>
              Rol en la clínica
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                required
              >
                <option value="clinic_admin">Administrador clínico</option>
                <option value="dentist">Dentista</option>
                <option value="receptionist">Recepcionista</option>
              </select>
            </label>

            <label className="clinic-team-modal__checkbox">
              <input
                type="checkbox"
                checked={generatePassword}
                onChange={(event) =>
                  setGeneratePassword(event.target.checked)
                }
              />
              <span>
                Generar contraseña temporal
                <small>
                  El usuario deberá cambiarla en su siguiente inicio de sesión.
                </small>
              </span>
            </label>

            {error && (
              <p className="clinic-team-modal__error" role="alert">
                {error}
              </p>
            )}

            <footer className="clinic-team-modal__actions">
              <button type="button" onClick={onClose} disabled={loading}>
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
