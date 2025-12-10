import { PendingListing, PendingListingsMeta } from '@/models/listings';

export interface UnpaidListingsResponse {
  meta?: PendingListingsMeta | null;
  listings: PendingListing[];
}

export interface ApproveResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}
