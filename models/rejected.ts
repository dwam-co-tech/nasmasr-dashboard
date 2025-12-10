import { PendingListingsMeta } from '@/models/listings';

export interface RejectedListing {
  id?: number | null;
  listing_id?: number | null;
  status?: string | null;
  category_name?: string | null;
  created_at?: string | null;
  expire_at?: string | null;
  rejected_by?: string | null;
  rejection_reason?: string | null;
  advertiser_id?: number | null;
  advertiser_phone?: string | null;
  views?: number | null;
}

export interface RejectedListingsResponse {
  meta: PendingListingsMeta;
  listings: RejectedListing[];
}

export interface ReopenListingResponse {
  message?: string;
}
