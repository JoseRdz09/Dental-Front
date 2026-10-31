export type OrganizationRole = "owner";

export type ClinicRole = "clinic_admin";

export type UserRole = OrganizationRole | ClinicRole;

export interface Organization {
  id: number;
  name: string;
  role: OrganizationRole;
}

export interface Clinic {
  id: number;
  name: string;
  role: ClinicRole;
}

export interface User {
  id: number;
  name: string;
  email: string;
  organizations: Organization[];
  clinics: Clinic[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  organizations: Organization[];
  clinics: Clinic[];
}

export interface MeResponse {
  user: User;
  organizations: Organization[];
  clinics: Clinic[];
}

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}