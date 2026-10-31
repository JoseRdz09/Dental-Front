
export type PatientStatus = "active" | "inactive";

/**
 * Información del paciente recibida del backend.
 */
export interface Patient {
  id: number;
  clinic_id: number;
  record_clinical: string;

  first_name: string;
  last_name: string;

  phone: string | null;
  birth_date: string | null;
  gender: string | null;

  address: string | null;

  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;

  notes: string | null;
  status: PatientStatus;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Información utilizada en el formulario.
 */
export interface PatientFormData {
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string;
  gender: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  status: PatientStatus;
}

/**
 * Información enviada al backend.
 */
export interface PatientPayload {
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  status: PatientStatus;
}

/**
 * Respuesta paginada de pacientes.
 */
export interface PaginatedPatients {
  current_page: number;
  data: Patient[];
  last_page: number;
  per_page: number;
  total: number;
}