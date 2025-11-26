export interface MakeItem {
  name: string;
  models: string[];
}

export interface CarMakesResponse {
  count?: number;
  makes: MakeItem[];
}

export interface CategoryField {
  field_name: string;
  options: string[];
}

export interface CityItem {
  id?: number;
  governorate_id?: number;
  name: string;
}

export interface GovernorateItem {
  id?: number;
  name: string;
  cities: string[];
}

export interface GovernoratesResponse {
  count?: number;
  governorates: GovernorateItem[];
}
export type CategorySlug =
  | 'real_estate'
  | 'cars'
  | 'cars_rent'
  | 'spare-parts'
  | 'stores'
  | 'restaurants'
  | 'groceries'
  | 'food-products'
  | 'electronics'
  | 'home-tools'
  | 'furniture'
  | 'doctors'
  | 'health'
  | 'teachers'
  | 'education'
  | 'jobs'
  | 'shipping'
  | 'mens-clothes'
  | 'watches-jewelry'
  | 'free-professions'
  | 'kids-toys'
  | 'gym'
  | 'construction'
  | 'maintenance'
  | 'car-services'
  | 'home-services'
  | 'lighting-decor'
  | 'animals'
  | 'farm-products'
  | 'wholesale'
  | 'production-lines'
  | 'light-vehicles'
  | 'heavy-transport'
  | 'tools'
  | 'home-appliances'
  | 'missing';
export const CATEGORY_SLUGS: CategorySlug[] = [
  'real_estate',
  'cars',
  'cars_rent',
  'spare-parts',
  'stores',
  'restaurants',
  'groceries',
  'food-products',
  'electronics',
  'home-tools',
  'furniture',
  'doctors',
  'health',
  'teachers',
  'education',
  'jobs',
  'shipping',
  'mens-clothes',
  'watches-jewelry',
  'free-professions',
  'kids-toys',
  'gym',
  'construction',
  'maintenance',
  'car-services',
  'home-services',
  'lighting-decor',
  'animals',
  'farm-products',
  'wholesale',
  'production-lines',
  'light-vehicles',
  'heavy-transport',
  'tools',
  'home-appliances',
  'missing',
];
export type CategoryFieldMap = Record<string, string[]>;
export type CategoryFieldsBySlug = Partial<Record<CategorySlug, CategoryField[]>>;
export type CategoryFieldMapBySlug = Partial<Record<CategorySlug, CategoryFieldMap>>;
