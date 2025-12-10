import { PendingListingsMeta } from '@/models/listings';

export interface ListingReport {
  id: number;
  title: string;
  category_name: string;
  status: string;
  advertiser_code: string;
  report_date: string;
  reasons: string[];
  reports_count: number;
  report_status: string;
}

export interface ListingReportsResponse {
  meta: PendingListingsMeta;
  data: ListingReport[];
}

export interface ListingReportAcceptResponse {
  message?: string;
}

export interface ListingReportDismissResponse {
  message?: string;
}

export interface ListingDetailsUserInline {
  id: number;
  name: string | null;
  phone: string | null;
}

export interface ListingDetailsData {
  id: number;
  category_id: number;
  category: string | null;
  category_name: string | null;
  title: string | null;
  price: string | null;
  currency: string | null;
  description: string | null;
  governorate: string | null;
  city: string | null;
  lat: string | null;
  lng: string | null;
  address: string | null;
  status: string | null;
  published_at: string | null;
  plan_type: string | null;
  contact_phone: string | null;
  whatsapp_phone: string | null;
  make_id: number | null;
  make: string | null;
  model_id: number | null;
  model: string | null;
  main_image: string | null;
  main_image_url: string | null;
  images: unknown | null;
  images_urls: string[];
  attributes: Record<string, string>;
  views: number;
  rank: number;
  country_code: string | null;
  created_at: string | null;
  updated_at: string | null;
  expire_at: string | null;
  isPayment: boolean;
  publish_via: string | null;
  admin_comment: string | null;
  user: ListingDetailsUserInline;
}

export interface ListingDetailsUser {
  id: number;
  name: string | null;
  joined_at: string | null;
  joined_at_human: string | null;
}

export interface ListingReportReadResponse {
  data: ListingDetailsData;
  user: ListingDetailsUser;
  message?: string;
}
