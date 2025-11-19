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

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  role?: string;
  status?: string;
  referral_code?: string;
}

export interface UpdateUserResponse {
  message: string;
  user: UserSummary;
}

export interface BlockUserResponse {
  message: string;
}

export interface DeleteUserResponse {
  message: string;
}

export interface CreateUserPayload {
  name?: string;
  phone: string;
  role?: string;
  status?: string;
  referral_code?: string;
  password?: string;
}

export interface CreateUserResponse {
  message: string;
  user: UserSummary;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface CreateOtpResponse {
  message: string;
  otp: number;
}

export interface UserListing {
  id: number;
  title: string;
  image: string | null;
  section: string;
  status: string;
  published_at: string;
}

export interface SingleUserListingsResponse {
  user: UserSummary;
  listings: UserListing[];
  meta: UsersMeta;
}

export interface CategoryItem {
  slug: string;
}

export interface CategoriesResponse {
  data: CategoryItem[];
}
