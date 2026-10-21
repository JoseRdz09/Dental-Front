
export interface Clinic {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  timezone: string | null;
  organization_id?: number;
  role?: string;
}
