
import { api } from "../../../../lib/axios";
import type { Clinic } from "../types/clinic";

interface MyClinicsResponse {
  data: Clinic[];
}

// Evita duplicar la petición mientras está en curso.
let clinicsRequest: Promise<Clinic[]> | null = null;

export function getMyClinics(): Promise<Clinic[]> {
  if (!clinicsRequest) {
    clinicsRequest = api
      .get<Clinic[] | MyClinicsResponse>("/api/my-clinics")
      .then((response) => {
        const result = response.data;

        return Array.isArray(result) ? result : result.data;
      })
      .finally(() => {
        clinicsRequest = null;
      });
  }
  

  return clinicsRequest;
}

export interface UpdateClinicData {
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  timezone: string;
}

export async function updateClinic(
  clinicId: number,
  values: UpdateClinicData,
): Promise<Clinic> {
  const response = await api.put<{ data: Clinic }>(
    `/api/my-clinics/${clinicId}`,
    values,
  );

  return response.data.data;
}
