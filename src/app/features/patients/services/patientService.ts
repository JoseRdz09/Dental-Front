
import axios from "axios";
import { api } from "../../../../lib/axios";

import type {
  PaginatedPatients,
  Patient,
  PatientPayload,
  PatientFormData,
} from "../types/patient";

/**
 * Obtener mensaje de error del servidor.
 */
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      "Ocurrió un error al comunicarse con el servidor."
    );
  }

  return "Ocurrió un error inesperado.";
}

/**
 * Preparar cookie CSRF de Laravel Sanctum.
 */
async function prepareCsrf(): Promise<void> {
  await api.get("/sanctum/csrf-cookie");
}

/**
 * Obtener pacientes de la clínica.
 *
 * Permite paginación y búsqueda por nombre o apellidos.
 * GET /api/patients?page=1&search=maria
 */
export async function getPatients(
  page = 1,
  search = ""
): Promise<PaginatedPatients> {
  try {
    const normalizedSearch = search.trim();

    const response = await api.get<PaginatedPatients>(
      "/api/patients",
      {
        params: {
          page,
          ...(normalizedSearch.length >= 2
            ? { search: normalizedSearch }
            : {}),
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Obtener información completa de un paciente.
 * GET /api/patients/{id}
 */
export async function getPatient(id: number): Promise<Patient> {
  try {
    const response = await api.get<{ patient: Patient }>(
      `/api/patients/${id}`
    );

    return response.data.patient;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Registrar un paciente.
 * POST /api/patients
 */
export async function createPatient(
  payload: PatientPayload
): Promise<Patient> {
  try {
    await prepareCsrf();

    const response = await api.post<{ patient: Patient }>(
      "/api/patients",
      payload
    );

    return response.data.patient;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Actualizar información de un paciente.
 * PATCH /api/patients/{id}
 */
export async function updatePatient(
  id: number,
  payload: Partial<PatientPayload>
): Promise<Patient> {
  try {
    await prepareCsrf();

    const response = await api.patch<{ patient: Patient }>(
      `/api/patients/${id}`,
      payload
    );

    return response.data.patient;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Eliminar un paciente mediante Soft Delete.
 * DELETE /api/patients/{id}
 */
export async function deletePatient(id: number): Promise<void> {
  try {
    await prepareCsrf();

    await api.delete(`/api/patients/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Valores iniciales del formulario.
 */
export const emptyPatientForm: PatientFormData = {
  first_name: "",
  last_name: "",
  phone: "",
  birth_date: "",
  gender: "",
  address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  notes: "",
  status: "active",
};

/**
 * Convertir un paciente a los valores del formulario.
 */
export function getPatientFormData(
  patient: Patient | null
): PatientFormData {
  if (!patient) {
    return { ...emptyPatientForm };
  }

  return {
    first_name: patient.first_name ?? "",
    last_name: patient.last_name ?? "",
    phone: patient.phone ?? "",
    birth_date: patient.birth_date ?? "",
    gender: patient.gender ?? "",
    address: patient.address ?? "",
    emergency_contact_name:
      patient.emergency_contact_name ?? "",
    emergency_contact_phone:
      patient.emergency_contact_phone ?? "",
    notes: patient.notes ?? "",
    status: patient.status ?? "active",
  };
}

/**
 * Preparar datos para enviar al backend.
 */
export function preparePatientPayload(
  form: PatientFormData
): PatientPayload {
  return {
    ...form,
    birth_date: form.birth_date || null,
    gender: form.gender || null,
    address: form.address || null,
    emergency_contact_name:
      form.emergency_contact_name || null,
    emergency_contact_phone:
      form.emergency_contact_phone || null,
    notes: form.notes || null,
    status: form.status,
  };
}
