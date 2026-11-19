
import { api } from "../../../../lib/axios";

import type {
  OrganizationResponse,
  UpdateOrganizationResponse,
} from "../types/organization";

/**
 * Obtener información de una organización.
 */
export async function getOrganization(
  organizationId: number,
): Promise<OrganizationResponse> {
  const { data } = await api.get<OrganizationResponse>(
    `/api/organizations/${organizationId}`,
  );

  return data;
}

/**
 * Actualizar nombre y logotipo de una organización.
 */
export async function updateOrganization(
  organizationId: number,
  payload: FormData,
): Promise<UpdateOrganizationResponse> {
  const { data } = await api.post<UpdateOrganizationResponse>(
    `/api/organizations/${organizationId}`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data;
}
