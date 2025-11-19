export interface SystemSettingsPayload {
  support_number?: string;
  sub_support_number?: string;
  emergency_number?: string;
  privacy_policy?: string;
  'terms_conditions-main_'?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  email?: string;
  show_phone?: boolean;
  featured_users_count?: number;
}

export interface SystemSettingsData {
  support_number: string;
  sub_support_number: string;
  emergency_number: string;
  privacy_policy: string;
  'terms_conditions-main_'?: string;
  facebook: string;
  twitter: string;
  instagram: string;
  email: string;
  show_phone: boolean;
  featured_users_count: number;
}

export interface SystemSettingsResponse {
  status: string;
  data: SystemSettingsData;
}