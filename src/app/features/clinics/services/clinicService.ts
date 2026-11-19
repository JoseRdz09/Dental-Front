
import { api } from "../../../../lib/axios";
import type { Clinic } from "../types/clinic";

interface MyClinicsResponse {
  data: Clinic[];
}

export async function getMyClinics(): Promise<Clinic[]> {
  const response = await api.get<Clinic[] | MyClinicsResponse>(
    "/api/my-clinics"
  );

  const result = response.data;

  return Array.isArray(result) ? result : result.data;
}

export interface UpdateClinicData {
  name: string;
  logo_file?: File | null;
  email: string;
  phone: string;
  address: string;
  status: string;
  timezone: string;
}

export async function updateClinic(
  clinicId: number,
  values: UpdateClinicData
): Promise<Clinic> {
  const formData = new FormData();

  formData.append("name", values.name);
  formData.append("email", values.email);
  formData.append("phone", values.phone);
  formData.append("address", values.address);
  formData.append("status", values.status);
  formData.append("timezone", values.timezone);

  if (values.logo_file instanceof File) {
    formData.append("logo_file", values.logo_file);
  }

  // Simular PUT para que Laravel procese correctamente el archivo.
  formData.append("_method", "PUT");

  const response = await api.post<{ data: Clinic }>(
    `/api/my-clinics/${clinicId}`,
    formData
  );

  return response.data.data;
}


export async function deleteClinic(
  clinicId: number
): Promise<void> {
  await api.delete(`/api/clinics/${clinicId}`);
}
