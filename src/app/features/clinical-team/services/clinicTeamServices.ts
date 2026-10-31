
import axios from "axios";
import { api } from "../../../../lib/axios";

import type {
  ApiErrorResponse,
  ClinicTeamResponse,
  CreateClinicTeamMemberPayload,
  CreateClinicTeamMemberResponse,
  UpdateClinicTeamMemberPayload,
} from "../types/clinicTeam";

interface UpdateClinicTeamMemberResponse {
  message?: string;
  temporary_password?: string;
}

/**
 * Convierte los errores HTTP de Laravel en mensajes entendibles.
 */
function handleApiError(error: unknown, fallbackMessage: string): never {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data;

    const validationErrors = responseData?.errors
      ? Object.values(responseData.errors).flat().join(" ")
      : "";

    if (status === 401) {
      throw new Error(
        "Tu sesión ha expirado. Inicia sesión nuevamente.",
      );
    }

    if (status === 403) {
      throw new Error(
        responseData?.message || "No tienes permisos para realizar esta acción.",
      );
    }

    if (status === 419) {
      throw new Error(
        "La sesión de seguridad expiró. Recarga la página e inténtalo nuevamente.",
      );
    }

    throw new Error(
      validationErrors || responseData?.message || fallbackMessage,
    );
  }

  throw new Error(
    error instanceof Error
      ? error.message
      : "Ocurrió un error inesperado.",
  );
}

/**
 * Obtiene los integrantes del equipo de una clínica.
 */
export async function getClinicTeam(
  clinicId: number,
): Promise<ClinicTeamResponse> {
  if (!Number.isInteger(clinicId) || clinicId <= 0) {
    throw new Error("El ID de la clínica no es válido.");
  }

  try {
    const { data } = await api.get<ClinicTeamResponse>(
      `/api/clinics/${clinicId}/team`,
    );

    return data;
  } catch (error: unknown) {
    handleApiError(error, "No se pudo obtener el equipo de la clínica.");
  }
}

/**
 * Elimina un integrante del equipo.
 *
 * Nota: esta ruta debe coincidir con la que tengas definida en Laravel.
 */
export async function deleteClinicTeamMember(
  _clinicId: number,
  userId: number,
): Promise<void> {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("El ID del usuario no es válido.");
  }

  try {
    await api.delete(`/api/users/${userId}`);
  } catch (error: unknown) {
    handleApiError(error, "No se pudo eliminar al integrante.");
  }
}

/**
 * Actualiza los datos de un integrante del equipo clínico.
 */
export async function updateClinicTeamMember(
  clinicId: number,
  userId: number,
  payload: UpdateClinicTeamMemberPayload,
): Promise<UpdateClinicTeamMemberResponse> {
  try {
    await api.get("/sanctum/csrf-cookie");

    const { data } = await api.put<UpdateClinicTeamMemberResponse>(
      `/api/clinics/${clinicId}/team/${userId}`,
      payload,
    );

    return data;
  } catch (error: unknown) {
    handleApiError(error, "No se pudo actualizar al integrante.");
  }
}

/**
 * Crea un integrante del equipo clínico.
 */
export async function createClinicTeamMember(
  clinicId: number,
  payload: CreateClinicTeamMemberPayload,
): Promise<CreateClinicTeamMemberResponse> {
  try {
    await api.get("/sanctum/csrf-cookie");

    const { data } = await api.post<CreateClinicTeamMemberResponse>(
      `/api/clinics/${clinicId}/team`,
      payload,
    );

    return data;
  } catch (error: unknown) {
    handleApiError(error, "No se pudo crear el integrante.");
  }
}
