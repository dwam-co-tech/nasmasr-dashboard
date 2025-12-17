import { createListingForm } from '@/services/listings';
import type { CreateListingPayload } from '@/models/create-listing';

const toNum = (v: unknown): number | undefined => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return undefined;
    const n = Number(s);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

export function buildFormDataFromPayload(payload: CreateListingPayload): FormData {
  const fd = new FormData();
  if (payload.description) fd.append('description', String(payload.description));
  if (payload.price !== undefined && payload.price !== null && String(payload.price).trim()) fd.append('price', String(payload.price));
  if (payload.currency) fd.append('currency', String(payload.currency));
  if (payload.plan_type) fd.append('plan_type', String(payload.plan_type));
  if (payload.contact_phone) fd.append('contact_phone', String(payload.contact_phone));
  if (payload.whatsapp_phone) fd.append('whatsapp_phone', String(payload.whatsapp_phone));
  if (payload.country_code) fd.append('country_code', String(payload.country_code));
  if (payload.governorate) fd.append('governorate', String(payload.governorate));
  if (payload.city) fd.append('city', String(payload.city));
  if (payload.address) fd.append('address', String(payload.address));
  if (payload.lat !== undefined && payload.lat !== null && String(payload.lat).trim()) fd.append('lat', String(payload.lat));
  if (payload.lng !== undefined && payload.lng !== null && String(payload.lng).trim()) fd.append('lng', String(payload.lng));
  if (payload.map_link) fd.append('map_link', String(payload.map_link));
  if (payload.published_at) fd.append('published_at', String(payload.published_at));
  if (payload.expire_at) fd.append('expire_at', String(payload.expire_at));
  fd.append('category', String(payload.category));
  if (payload.attributes) {
    for (const [k, v] of Object.entries(payload.attributes)) {
      const val = String(v ?? '').trim();
      if (!val) continue;
      fd.append(`attributes[${k}]`, val);
    }
  }
  if (payload.main_image_file) fd.append('main_image', payload.main_image_file);
  if (Array.isArray(payload.image_files) && payload.image_files.length) {
    for (const img of payload.image_files.slice(1)) fd.append('images[]', img);
    if (!payload.main_image_file) fd.append('main_image', payload.image_files[0]);
  } else if (payload.main_image_url) {
    fd.append('main_image_url', payload.main_image_url);
    if (Array.isArray(payload.images_urls)) {
      for (const url of payload.images_urls) fd.append('images_urls[]', url);
    }
  }
  const carsKeys = ['make_id', 'model_id', 'make', 'model', 'year', 'transmission', 'fuel_type', 'odometer', 'condition'] as const;
  for (const k of carsKeys) {
    const v = (payload as unknown as Record<string, unknown>)[k];
    if (v === undefined || v === null) continue;
    const isNum = ['make_id', 'model_id', 'year', 'odometer'].includes(k);
    fd.append(k, isNum ? String(toNum(v) ?? '') : String(v));
  }
  const reKeys = ['main_section_id', 'sub_section_id', 'area', 'rooms', 'bathrooms', 'floor_level', 'finishing_type'] as const;
  for (const k of reKeys) {
    const v = (payload as unknown as Record<string, unknown>)[k];
    if (v === undefined || v === null) continue;
    const isNum = ['main_section_id', 'sub_section_id', 'area', 'rooms', 'bathrooms', 'floor_level'].includes(k);
    fd.append(k, isNum ? String(toNum(v) ?? '') : String(v));
  }
  return fd;
}

export async function createListingWithPayload(categorySlug: string, payload: CreateListingPayload, token?: string): Promise<Record<string, unknown>> {
  const fd = buildFormDataFromPayload(payload);
  return createListingForm(categorySlug, fd, token);
}
