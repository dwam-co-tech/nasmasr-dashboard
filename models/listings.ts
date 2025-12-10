export interface PendingListingsMeta {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PendingListing {
  id: number;
  category_id: number;
  category: string;
  category_name: string;
  title: string | null;
  price: string | number | null;
  currency: string | null;
  description: string | null;
  governorate: string | null;
  city: string | null;
  lat?: string | null;
  lng?: string | null;
  address?: string | null;
  status: string | null;
  published_at: string | null;
  plan_type: string | null;
  contact_phone?: string | null;
  whatsapp_phone?: string | null;
  make_id?: number | null;
  make?: string | null;
  model_id?: number | null;
  model?: string | null;
  main_image?: string | null;
  main_image_url?: string | null;
  images?: string[] | null;
  images_urls?: string[] | null;
  attributes?: Record<string, string> | null;
  views?: number | null;
  rank?: number | null;
  country_code?: string | null;
  created_at: string;
  updated_at?: string | null;
  expire_at?: string | null;
  isPayment?: boolean | null;
  publish_via?: string | null;
  admin_comment?: string | null;
  user?: ListingUser | null;
}

export interface PendingListingsResponse {
  meta: PendingListingsMeta;
  listings: PendingListing[];
}

export interface SystemSettingsUpdateRequest {
  manual_approval: boolean;
}

export interface SystemSettings {
  manual_approval: boolean;
}

export interface ListingUser {
  id: number;
  name?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
  registered_at?: string | null;
  avatar?: string | null;
}
