
import { useEffect, useState } from "react";
import axios from "axios";

import {
  getSettings,
  updatePassword,
} from "../services/settingsService";

import type {
  UserSettings,
  UpdatePasswordPayload,
} from "../types/settings";

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
  const [user, setUser] = useState<UserSettings | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await getSettings();

        if (!cancelled) {
          setUser(response.user);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setProfileError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePasswordSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("La confirmación de la contraseña no coincide.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError(
        "La nueva contraseña debe ser diferente de la actual.",
      );
      return;
    }

    setSavingPassword(true);

    const payload: UpdatePasswordPayload = {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: confirmPassword,
    };

    try {
      const response = await updatePassword(payload);

      setPasswordMessage(response.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      setPasswordError(getErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-card settings-state" role="status">
        Cargando información de tu cuenta...
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

        {profileError && (
          <p className="settings-alert settings-alert--error" role="alert">
            {profileError}
          </p>
        )}

        {!profileError && user && (
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

          {passwordError && (
            <p className="settings-alert settings-alert--error" role="alert">
              {passwordError}
            </p>
          )}

          {passwordMessage && (
            <p className="settings-alert settings-alert--success" role="status">
              {passwordMessage}
            </p>
          )}

          <div className="settings-form__actions">
            <button
              type="submit"
              className="settings-button"
              disabled={savingPassword}
            >
              {savingPassword ? "Actualizando..." : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
