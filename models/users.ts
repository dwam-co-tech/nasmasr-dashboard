export interface UsersMeta {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface UserSummary {
  id: number;
  name: string | null;
  phone: string;
  user_code: string;
  status: string;
  registered_at: string;
  listings_count: number;
  role: string;
}

export interface UsersSummaryResponse {
  meta: UsersMeta;
  users: UserSummary[];
}