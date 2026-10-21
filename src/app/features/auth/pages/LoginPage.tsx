
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

import { useAuth } from "../useAuth";

import type { ApiErrorResponse } from "../../../../types/auth";

import "./LoginPage.css";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Introduce un correo electrónico válido."),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria."),
});


type LoginFormData = z.infer<typeof loginSchema>;

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

  if (loading) {
    return <div className="auth-loading">Verificando sesión...</div>;
  }

  if (user) {
    if (user.role === "owner") {
      return <Navigate to="/owner" replace />;
    }

    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  async function onSubmit(values: LoginFormData) {
    setServerError("");

    try {
      const authenticatedUser = await signIn(values);

      if (authenticatedUser.role === "owner") {
        navigate("/owner", { replace: true });
      } else if (authenticatedUser.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        setServerError("El usuario no tiene un rol válido.");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const data = error.response?.data;
        const validationErrors = data?.errors;

        if (validationErrors) {
          const firstError = Object.values(validationErrors).flat()[0];

          setServerError(
            firstError ?? "No fue posible iniciar sesión."
          );
        } else if (!error.response) {
          setServerError(
            "No se pudo conectar con el servidor. Comprueba que Laravel esté ejecutándose."
          );
        } else if (error.response.status === 419) {
          setServerError(
            "La sesión de seguridad expiró. Recarga la página e inténtalo de nuevo."
          );
        } else {
          setServerError(
            data?.message ?? "No fue posible iniciar sesión."
          );
        }
      } else {
        setServerError("Ocurrió un error inesperado.");
      }
    }
  }

  

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">D</div>
          <span>Dental<span className="brand-accent">Care</span></span>
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
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <span className="field-error">{errors.email.message}</span>
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
                aria-invalid={!!errors.password}
                {...register("password")}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            {errors.password && (
              <span className="field-error">
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
