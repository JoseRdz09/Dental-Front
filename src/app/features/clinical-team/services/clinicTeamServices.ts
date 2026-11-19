
import axios from "axios";
import { api } from "../../../../lib/axios";

import type {
  ApiErrorResponse,
  ClinicTeamResponse,
  ClinicTeamMember,
  CreateClinicTeamMemberPayload,
  CreateClinicTeamMemberResponse,
  UpdateClinicTeamMemberPayload,
} from "../types/clinicTeam";

interface UpdateClinicTeamMemberResponse {
  message?: string;
  temporary_password?: string;
}



/**
 * Convierte los errores HTTP de Laravel
 * en mensajes entendibles.
 */
function handleApiError(
  error: unknown,
  fallbackMessage: string
): never {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data;

    const validationErrors = responseData?.errors
      ? Object.values(responseData.errors).flat().join(" ")
      : "";

    if (status === 401) {
      throw new Error(
        "Tu sesión ha expirado. Inicia sesión nuevamente."
      );
    }

    if (status === 403) {
      throw new Error(
        responseData?.message ||
          "No tienes permisos para realizar esta acción."
      );
    }

    if (status === 419) {
      throw new Error(
        "La sesión de seguridad expiró. Recarga la página e inténtalo nuevamente."
      );
    }

    throw new Error(
      validationErrors ||
        responseData?.message ||
        fallbackMessage
    );
  }

  throw new Error(
    error instanceof Error
      ? error.message
      : "Ocurrió un error inesperado."
  );
}

/**
 * Obtiene los datos de una clínica y sus integrantes.
 *
 * GET /api/clinics/{clinicId}/team
 */
export async function getClinicTeam(
  clinicId: number
): Promise<ClinicTeamResponse> {
  if (!Number.isInteger(clinicId) || clinicId <= 0) {
    throw new Error("El ID de la clínica no es válido.");
  }

  try {
    const { data } = await api.get<ClinicTeamResponse>(
      `/api/clinics/${clinicId}/team`
    );

    return data;
  } catch (error: unknown) {
    handleApiError(
      error,
      "No se pudo obtener la información de la clínica y su equipo."
    );
  }
}

/**
 * Elimina un integrante del equipo.
 *
 * DELETE /api/users/{userId}
 */
export async function deleteClinicTeamMember(
  userId: number
): Promise<void> {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("El ID del usuario no es válido.");
  }

  try {
    await api.delete(`/api/users/${userId}`);
  } catch (error: unknown) {
    handleApiError(
      error,
      "No se pudo eliminar al integrante."
    );
  }
}

/**
 * Actualiza los datos de un integrante.
 *
 * PUT /api/clinics/{clinicId}/team/{userId}
 */
export async function updateClinicTeamMember(
  clinicId: number,
  userId: number,
  payload: UpdateClinicTeamMemberPayload
): Promise<UpdateClinicTeamMemberResponse> {
  if (
    !Number.isInteger(clinicId) ||
    clinicId <= 0 ||
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    throw new Error("Los identificadores no son válidos.");
  }

  try {
    const { data } = await api.put<UpdateClinicTeamMemberResponse>(
      `/api/clinics/${clinicId}/team/${userId}`,
      payload
    );

    return data;
  } catch (error: unknown) {
    handleApiError(
      error,
      "No se pudo actualizar al integrante."
    );
  }
}

/**
 * Crea un integrante del equipo.
 *
 * POST /api/clinics/{clinicId}/team
 */
export async function createClinicTeamMember(
  clinicId: number,
  payload: CreateClinicTeamMemberPayload
): Promise<CreateClinicTeamMemberResponse> {
  if (!Number.isInteger(clinicId) || clinicId <= 0) {
    throw new Error("El ID de la clínica no es válido.");
  }

  try {
    const { data } = await api.post<CreateClinicTeamMemberResponse>(
      `/api/clinics/${clinicId}/team`,
      payload
    );

    return data;
  } catch (error: unknown) {
    handleApiError(
      error,
      "No se pudo crear el integrante."
    );
  }
}


//Nuevo

export interface ClinicWithTeam {
  id: number;
  name: string;
  logo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string;
  timezone?: string;
  organization_id?: number;

  team: {
    total: number;
    data: ClinicTeamMember[];
  };
}

interface ClinicsWithTeamResponse {
  clinics: ClinicWithTeam[];
}

export async function getClinicsWithTeam(): Promise<ClinicWithTeam[]> {
  try {
    const { data } = await api.get<ClinicsWithTeamResponse>(
      "/api/clinics/team"
    );

    return data.clinics ?? [];
  } catch (error) {
    throw handleApiError(
      error,
      "No se pudieron cargar las clínicas y sus integrantes."
    );
  }
}
