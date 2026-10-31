import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

import { useAuth } from "../useAuth";
import type {
  ApiErrorResponse,
  Organization,
  Clinic,
} from "../../../../types/auth";

import "./LoginPage.css";

/* -------------------------------------------------------------------------- */
/* Rutas autorizadas                                                          */
/* -------------------------------------------------------------------------- */

const ROLE_ROUTES = {
  owner: "/owner-dashboard",
  clinic_admin: "/dashboard",
} as const;

/* -------------------------------------------------------------------------- */
/* Obtener ruta según la relación del usuario                                 */
/* -------------------------------------------------------------------------- */

function getHomeRoute(
  organizations?: Organization[],
  clinics?: Clinic[]
): string | undefined {
  // El propietario se identifica mediante organization_user.
  const isOwner = organizations?.some(
    (organization) => organization.role === "owner"
  );

  if (isOwner) {
    return ROLE_ROUTES.owner;
  }

  // El administrador clínico se identifica mediante clinic_user.
  const isClinicAdmin = clinics?.some(
    (clinic) => clinic.role === "clinic_admin"
  );

  if (isClinicAdmin) {
    return ROLE_ROUTES.clinic_admin;
  }

  return undefined;
}

/* -------------------------------------------------------------------------- */
/* Manejo de errores                                                          */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const response = error.response;
    const data = response?.data;

    if (!response) {
      return "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.";
    }

    if (response.status === 419) {
      return "La sesión de seguridad expiró. Recarga la página e inténtalo de nuevo.";
    }

    if (data?.errors) {
      const firstError = Object.values(data.errors)
        .flat()
        .find((message): message is string => typeof message === "string");

      if (firstError) {
        return firstError;
      }
    }

    return data?.message ?? "No fue posible iniciar sesión.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

/* -------------------------------------------------------------------------- */
/* Validación del formulario                                                  */
/* -------------------------------------------------------------------------- */

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Introduce un correo electrónico válido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

type LoginFormData = z.infer<typeof loginSchema>;

/* -------------------------------------------------------------------------- */
/* Componente                                                                 */
/* -------------------------------------------------------------------------- */

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormData): Promise<void> {
    setServerError("");

    try {
      const response = await signIn(values);

      const homeRoute = getHomeRoute(
        response.organizations,
        response.clinics
      );

      if (!homeRoute) {
        setServerError(
          "Tu cuenta no tiene un rol autorizado para acceder a estos paneles. Contacta al administrador."
        );
        return;
      }

      navigate(homeRoute, { replace: true });
    } catch (error: unknown) {
      console.error("Error durante el inicio de sesión:", error);
      setServerError(getErrorMessage(error));
    }
  }

  if (loading) {
    return (
      <div className="auth-loading" role="status">
        Verificando sesión...
      </div>
    );
  }

  // Si ya existe una sesión, dirigir al usuario a su panel autorizado.
  if (user) {
    const existingHomeRoute = getHomeRoute(
      user.organizations,
      user.clinics
    );

    if (existingHomeRoute) {
      return <Navigate to={existingHomeRoute} replace />;
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">D</div>
          <span>
            Dental<span className="brand-accent">Care</span>
          </span>
        </div>

        <div className="auth-heading">
          <p className="auth-eyebrow">PANEL ADMINISTRATIVO</p>
          <h1>Bienvenido de nuevo</h1>
          <p>Ingresa tus credenciales para acceder a tu clínica.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="doctor@clinica.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />

            {errors.email && (
              <span id="email-error" className="field-error">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password">Contraseña</label>

            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                {...register("password")}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            {errors.password && (
              <span id="password-error" className="field-error">
                {errors.password.message}
              </span>
            )}
          </div>

          {serverError && (
            <div className="auth-error" role="alert">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="auth-footer">
          Acceso exclusivo para personal autorizado.
        </p>
      </section>
    </main>
  );
}