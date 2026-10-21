import { useState } from "react";
import type { FormEvent } from "react";
import { X, UserPlus, LoaderCircle } from "lucide-react";
import "../css/ClinicTeamCreateModal.css";

interface ClinicTeamCreateModalProps {
  clinicId: number;
  onClose: () => void;
  onCreated: () => void;
}

type ClinicRole = "clinic_admin" | "dentist" | "receptionist";

interface CreateTeamMemberResponse {
  message?: string;
  temporary_password?: string;
}

export default function ClinicTeamCreateModal({
  clinicId,
  onClose,
  onCreated,
}: ClinicTeamCreateModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ClinicRole>("dentist");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");
    setTemporaryPassword("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      setError("Completa el nombre y el correo electrónico.");
      return;
    }

    setLoading(true);

    try {
      // Obtener la cookie CSRF de Laravel Sanctum.
      const csrfResponse = await fetch(
        "http://localhost:8000/sanctum/csrf-cookie",
        {
          credentials: "include",
          headers: { Accept: "application/json" },
        }
      );

      if (!csrfResponse.ok) {
        throw new Error("No se pudo preparar la sesión de seguridad.");
      }

      // Leer la cookie XSRF-TOKEN.
      const xsrfCookie = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
        ?.split("=")
        .slice(1)
        .join("=");

      if (!xsrfCookie) {
        throw new Error(
          "No se encontró la cookie de seguridad. Verifica la configuración de Sanctum."
        );
      }

      const response = await fetch(
        `http://localhost:8000/api/clinics/${clinicId}/team`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": decodeURIComponent(xsrfCookie),
          },
          body: JSON.stringify({
            name: normalizedName,
            email: normalizedEmail,
            role,
          }),
        }
      );

      const data = (await response.json().catch(() => ({}))) as
        | CreateTeamMemberResponse
        | {
            message?: string;
            errors?: Record<string, string[]>;
          };

      if (!response.ok) {
        const validationErrors =
          "errors" in data && data.errors
            ? Object.values(data.errors).flat().join(" ")
            : "";

        throw new Error(
          validationErrors ||
            data.message ||
            "No se pudo crear el integrante."
        );
      }

      setSuccessMessage(data.message || "Integrante creado correctamente.");

      if ("temporary_password" in data && data.temporary_password) {
        setTemporaryPassword(data.temporary_password);
      } else {
        onCreated();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFinish() {
    onCreated();
  }

  return (
    <div
      className="clinic-team-create-modal__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
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
              <p>Registra un nuevo integrante del equipo clínico.</p>
            </div>
          </div>

          <button
            type="button"
            className="clinic-team-create-modal__close"
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </header>

        {temporaryPassword ? (
          <div className="clinic-team-create-modal__result">
            <h3>Integrante creado</h3>
            <p>{successMessage}</p>
            <p>
              El backend devolvió una contraseña temporal. Compártela
              únicamente mediante un canal seguro y solicita que se cambie
              al iniciar sesión.
            </p>

            <label htmlFor="temporary-password">
              Contraseña temporal
            </label>

            <input
              id="temporary-password"
              type="text"
              readOnly
              value={temporaryPassword}
            />

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
              <div className="clinic-team-create-modal__error" role="alert">
                {error}
              </div>
            )}

            {successMessage && (
              <div
                className="clinic-team-create-modal__success"
                role="status"
              >
                {successMessage}
              </div>
            )}

            <div className="clinic-team-create-modal__field">
              <label htmlFor="team-member-name">Nombre completo</label>
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
              <label htmlFor="team-member-role">Rol en la clínica</label>
              <select
                id="team-member-role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as ClinicRole)
                }
                disabled={loading}
              >
                <option value="dentist">Dentista</option>
                <option value="receptionist">Recepcionista</option>
                <option value="clinic_admin">Administrador de clínica</option>
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
                    <LoaderCircle size={17} className="clinic-team-create-modal__spinner" />
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
