import type { CategorySlug } from '@/models/makes';

export interface BaseCreateListingCommon {
  category: CategorySlug | string;
  description?: string;
  price?: string | number;
  currency?: string;
  plan_type?: string;
  contact_phone?: string;
  whatsapp_phone?: string;
  country_code?: string | number;
  governorate?: string;
  city?: string;
  address?: string;
  lat?: string | number;
  lng?: string | number;
  map_link?: string;
  published_at?: string;
  expire_at?: string;
  attributes?: Record<string, string>;
  main_image_file?: File;
  image_files?: File[];
  main_image_url?: string;
  images_urls?: string[];
}

export interface CreateListingCars extends BaseCreateListingCommon {
  make_id?: number;
  model_id?: number;
  make?: string;
  model?: string;
  year?: number;
  transmission?: string;
  fuel_type?: string;
  odometer?: number;
  condition?: string;
}

export interface CreateListingRealEstate extends BaseCreateListingCommon {
  main_section_id?: number;
  sub_section_id?: number;
  area?: number;
  rooms?: number;
  bathrooms?: number;
  floor_level?: number;
  finishing_type?: string;
}

export type CreateListingPayload = BaseCreateListingCommon | CreateListingCars | CreateListingRealEstate;
