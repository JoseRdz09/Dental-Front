
export interface Organization {
  id: number;
  name: string;
  logo_url: string | null;
}

export interface OrganizationResponse {
  organization: Organization;
}

export interface UpdateOrganizationResponse {
  message: string;
  organization: Organization;
}

export interface UpdateOrganizationPayload {
  name: string;
  logo?: File | null;
  remove_logo?: boolean;
}
