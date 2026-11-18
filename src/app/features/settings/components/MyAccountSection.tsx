
import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import { useSettings } from "../hooks/useSettings";

import type { UpdatePasswordPayload } from "../types/settings";

import LoadingScreen from "../../../../assets/shared/components/LoadingScreen";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const errors = error.response?.data?.errors;

    if (errors && typeof errors === "object") {
      const firstError = Object.values(errors).flat()[0];

      if (typeof firstError === "string") {
        return firstError;
      }
    }

    return error.response?.data?.message ?? "Ocurrió un error inesperado.";
  }

  return "No fue posible completar la operación.";
}

export default function MyAccountSection() {
  const {
    user,
    loading,
    error,
    updatePassword,
    updatingPassword,
  } = useSettings();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notificar errores de la consulta.
  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error));
    }
  }, [error]);

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("La confirmación de la contraseña no coincide.");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error(
        "La nueva contraseña debe ser diferente de la actual.",
      );
      return;
    }

    const payload: UpdatePasswordPayload = {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: confirmPassword,
    };

    try {
      const response = await updatePassword(payload);

      toast.success(response.message);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  }

  if (loading) {
    return (
      <div className="settings-card settings-state" role="status">
        <LoadingScreen />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="settings-card settings-state" role="alert">
        No fue posible cargar la información de tu cuenta.
      </div>
    );
  }

  return (
    <div className="settings-sections">
      <article className="settings-card">
        <div className="settings-card__heading">
          <div className="settings-avatar" aria-hidden="true">
            {user?.name?.trim().charAt(0).toUpperCase() || "U"}
          </div>

          <div>
            <h2>Información personal</h2>
            <p>Consulta los datos de tu cuenta.</p>
          </div>
        </div>

        {user && (
          <div className="settings-form">
            <div className="settings-field">
              <label htmlFor="settings-name">Nombre completo</label>
              <input
                id="settings-name"
                type="text"
                value={user.name}
                readOnly
                aria-readonly="true"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="settings-email">Correo electrónico</label>
              <input
                id="settings-email"
                type="email"
                value={user.email}
                readOnly
                aria-readonly="true"
              />
            </div>
          </div>
        )}
      </article>

      <article className="settings-card">
        <div className="settings-card__heading">
          <div className="settings-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
            </svg>
          </div>

          <div>
            <h2>Seguridad</h2>
            <p>Cambia tu contraseña para mantener tu cuenta protegida.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="settings-form">
          <div className="settings-field">
            <label htmlFor="current-password">Contraseña actual</label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </div>

          <div className="settings-field">
            <label htmlFor="new-password">Nueva contraseña</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              required
            />
            <small>Utiliza al menos 8 caracteres.</small>
          </div>

          <div className="settings-field">
            <label htmlFor="confirm-password">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="settings-form__actions">
            <button
              type="submit"
              className="settings-button"
              disabled={updatingPassword}
            >
              {updatingPassword
                ? "Actualizando..."
                : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
