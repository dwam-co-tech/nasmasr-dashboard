import type { CarMakesResponse, MakeItem, CategoryField, GovernorateItem, CityItem, CategorySlug, CategoryFieldMapBySlug, AdminCategoryFieldUpdateRequest, AdminCategoryFieldApiResponse, AdminMakeCreateResponse, AdminMakeModelsResponse, AdminMakeListItem } from '@/models/makes';

function toArray(x: unknown): unknown[] {
  return Array.isArray(x) ? x : [];
}

function normalizeString(x: unknown): string | null {
  if (typeof x === 'string' || typeof x === 'number') {
    const s = String(x).trim();
    return s.length ? s : null;
  }
  return null;
}

function normalizeModels(val: unknown): string[] {
  const out: string[] = [];
  const pickName = (o: Record<string, unknown>): string | null => {
    return (
      normalizeString(o['name'])
      || normalizeString(o['ar_name'])
      || normalizeString(o['en_name'])
      || normalizeString(o['city_name'])
      || normalizeString(o['city'])
      || normalizeString(o['title'])
      || normalizeString(o['model'])
      || normalizeString(o['value'])
      || normalizeString(o['label'])
      || normalizeString(o['text'])
    );
  };
  const pushToken = (t: unknown) => {
    const s = normalizeString(t);
    if (s) out.push(s);
  };
  if (typeof val === 'string' || typeof val === 'number') {
    const raw = String(val);
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    for (const tok of tokens) pushToken(tok);
  } else if (Array.isArray(val)) {
    for (const it of val) {
      const s = normalizeString(it);
      if (s) { out.push(s); continue; }
      if (it && typeof it === 'object') {
        const o = it as Record<string, unknown>;
        const cand = normalizeString(o['name'])
          || normalizeString(o['model'])
          || normalizeString(o['title'])
          || normalizeString(o['value']);
        if (cand) out.push(cand);
      }
    }
  } else if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      const s = normalizeString(v);
      if (s) { out.push(s); continue; }
      if (Array.isArray(v)) {
        for (const it of v) {
          const si = normalizeString(it);
          if (si) { out.push(si); continue; }
          if (it && typeof it === 'object') {
            const o = it as Record<string, unknown>;
            const cand = pickName(o);
            if (cand) out.push(cand);
          }
        }
      } else if (v && typeof v === 'object') {
        const cand = pickName(v as Record<string, unknown>);
        if (cand) out.push(cand);
      }
      if (typeof k === 'string' && k.trim().length >= 2 && !/^\d+$/.test(k)) {
        out.push(k.trim());
      }
    }
  }
  return Array.from(new Set(out));
}

function canonicalizeFieldName(raw: unknown, slug: string): string | null {
  const s = normalizeString(raw);
  if (!s) return null;
  const name = s.toLowerCase();
  if (name.includes('main') || name.includes('primary')) return 'category';
  if (name.includes('sub') || name.includes('secondary')) return 'sub';
  if (name === 'main_sections' || name === 'main_categories') return 'category';
  if (name === 'sub_sections' || name === 'sub_categories') return 'sub';
  return s;
}

export async function fetchCarMakes(token?: string): Promise<CarMakesResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://api.nasmasr.app/api/makes', { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب الماركات والموديلات');
    throw new Error(message);
  }
  let makes: MakeItem[] = [];
  let count: number | undefined = undefined;
  if (Array.isArray(raw)) {
    makes = raw
      .map((it) => {
        const obj = it as Record<string, unknown>;
        const name = (obj['name'] ?? obj['make'] ?? obj['brand']) as string | undefined;
        const models = normalizeModels(obj['models']);
        if (!name) return null;
        return { name, models } as MakeItem;
      })
      .filter(Boolean) as MakeItem[];
  } else if (typeof raw === 'object' && raw) {
    const obj = raw as Record<string, unknown>;
    const arr = (obj['makes'] ?? obj['data']) as unknown;
    if (Array.isArray(arr)) {
      makes = arr
        .map((it) => {
          const o = it as Record<string, unknown>;
          const name = (o['name'] ?? o['make'] ?? o['brand']) as string | undefined;
          const models = normalizeModels(o['models']);
          if (!name) return null;
          return { name, models } as MakeItem;
        })
        .filter(Boolean) as MakeItem[];
      const c = obj['count'];
      if (typeof c === 'number') count = c;
    } else {
      const keys = Object.keys(obj);
      const items: MakeItem[] = [];
      for (const k of keys) {
        const v = obj[k];
        const models = normalizeModels(v);
        if (models.length) items.push({ name: k, models });
      }
      makes = items;
    }
  }
  return { makes, count } as CarMakesResponse;
}

export async function fetchCategoryFields(categorySlug: CategorySlug | string, token?: string): Promise<CategoryField[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const urlAdmin = `https://api.nasmasr.app/api/admin/category-fields/api/category-fields?category_slug=${encodeURIComponent(categorySlug)}`;
  const urlOld = `https://api.nasmasr.app/api/category-fields?category_slug=${encodeURIComponent(categorySlug)}`;
  const urlNew = `https://api.nasmasr.app/api/api/category-fields?category_slug=${encodeURIComponent(categorySlug)}`;
  let res = await fetch(t ? urlAdmin : urlOld, { method: 'GET', headers });
  let raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const nextUrl = t ? urlOld : urlNew;
    res = await fetch(nextUrl, { method: 'GET', headers });
    raw = (await res.json().catch(() => null)) as unknown;
    if (!res.ok || !raw) {
      const finalUrl = t ? urlNew : urlOld;
      res = await fetch(finalUrl, { method: 'GET', headers });
      raw = (await res.json().catch(() => null)) as unknown;
    }
  }
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب حقول التصنيف';
    throw new Error(message);
  }
  const normalizeOptions = (val: unknown): string[] => normalizeModels(val);
  const out: CategoryField[] = [];
  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (it && typeof it === 'object') {
        const o = it as Record<string, unknown>;
        const nameRaw = (o['field_name'] ?? o['name'] ?? o['title']) as unknown;
        const nameCanon = canonicalizeFieldName(nameRaw, String(categorySlug));
        const name = nameCanon ?? undefined;
        const options = normalizeOptions(o['options']);
        if (name) out.push({ field_name: name, options });
      }
    }
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj['fields'] ?? obj['data'];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (it && typeof it === 'object') {
          const o = it as Record<string, unknown>;
          const nameRaw = (o['field_name'] ?? o['name'] ?? o['title']) as unknown;
          const nameCanon = canonicalizeFieldName(nameRaw, String(categorySlug));
          const name = nameCanon ?? undefined;
          const options = normalizeOptions(o['options']);
          if (name) out.push({ field_name: name, options });
        }
      }
    } else {
      const keys = Object.keys(obj);
      for (const k of keys) {
        const v = obj[k];
        const options = normalizeOptions(v);
        const kCanon = canonicalizeFieldName(k, String(categorySlug)) ?? k;
        if (options.length) out.push({ field_name: kCanon, options });
      }
    }
  }
  return out;
}

export async function fetchCategoryFieldsBatch(slugs: (CategorySlug | string)[], token?: string): Promise<Record<string, CategoryField[]>> {
  const tasks = slugs.map(async (s) => {
    try {
      const fields = await fetchCategoryFields(s as CategorySlug, token);
      return [s, fields] as const;
    } catch {
      return [s, []] as const;
    }
  });
  const entries = await Promise.all(tasks);
  return Object.fromEntries(entries);
}

export function fieldsToMap(fields: CategoryField[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const f of fields) {
    const key = String(f.field_name || '').trim();
    const options = Array.isArray(f.options) ? f.options : [];
    if (key) out[key] = options;
  }
  return out;
}

export async function fetchCategoryFieldMaps(slugs: (CategorySlug | string)[], token?: string): Promise<CategoryFieldMapBySlug> {
  const batch = await fetchCategoryFieldsBatch(slugs, token);
  const out: CategoryFieldMapBySlug = {};
  for (const [slug, fields] of Object.entries(batch)) {
    out[slug as CategorySlug] = fieldsToMap(fields as CategoryField[]);
  }
  return out;
}

export async function fetchCategoryMainSubs(slug: CategorySlug | string, token?: string): Promise<Record<string, string[]>> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const urlAdmin = `https://api.nasmasr.app/api/admin/category-fields/api/category-fields?category_slug=${encodeURIComponent(String(slug))}`;
  const urlOld = `https://api.nasmasr.app/api/category-fields?category_slug=${encodeURIComponent(String(slug))}`;
  const urlNew = `https://api.nasmasr.app/api/api/category-fields?category_slug=${encodeURIComponent(String(slug))}`;
  let res = await fetch(t ? urlAdmin : urlOld, { method: 'GET', headers });
  let raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const nextUrl = t ? urlOld : urlNew;
    res = await fetch(nextUrl, { method: 'GET', headers });
    raw = (await res.json().catch(() => null)) as unknown;
    if (!res.ok || !raw) {
      const finalUrl = t ? urlNew : urlOld;
      res = await fetch(finalUrl, { method: 'GET', headers });
      raw = (await res.json().catch(() => null)) as unknown;
    }
  }
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب حقول التصنيف';
    throw new Error(message);
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const mainSections = obj['main_sections'];
    if (Array.isArray(mainSections)) {
      const out: Record<string, string[]> = {};
      for (const it of mainSections) {
        if (!it || typeof it !== 'object') continue;
        const o = it as Record<string, unknown>;
        const mainName = normalizeString(o['name']) || normalizeString(o['title']) || normalizeString(o['value']) || undefined;
        const subsRaw = o['sub_sections'];
        const subs: string[] = Array.isArray(subsRaw)
          ? subsRaw.map((s) => {
              if (typeof s === 'string' || typeof s === 'number') return String(s).trim();
              if (s && typeof s === 'object') {
                const so = s as Record<string, unknown>;
                return normalizeString(so['name']) || normalizeString(so['title']) || normalizeString(so['value']) || '';
              }
              return '';
            }).filter((x) => x.length > 0)
          : [];
        if (mainName) out[mainName] = subs;
      }
      if (Object.keys(out).length) return out;
    }
  }
  const buildFlat = (fields: Record<string, string[]>) => {
    const mains = fields['category'] ?? fields['main'] ?? fields['main_sections'] ?? [];
    const subs = fields['sub'] ?? fields['sub_sections'] ?? [];
    const out: Record<string, string[]> = {};
    for (const m of mains) out[m] = subs;
    return out;
  };
  const parseOptsMap = (val: unknown): Record<string, string[]> => {
    const out: Record<string, string[]> = {};
    if (Array.isArray(val)) {
      for (const it of val) {
        if (typeof it === 'string' || typeof it === 'number') {
          const k = String(it).trim();
          if (k) out[k] = out[k] ?? [];
        } else if (it && typeof it === 'object') {
          const o = it as Record<string, unknown>;
          const kRaw = o['name'] ?? o['title'] ?? o['value'] ?? o['label'];
          const k = normalizeString(kRaw);
          const listVal = o['options'] ?? o['subs'] ?? o['children'] ?? o['models'];
          const list = normalizeModels(listVal);
          if (k) out[k] = list;
        }
      }
    } else if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      for (const [kRaw, v] of Object.entries(obj)) {
        const k = normalizeString(kRaw);
        const list = normalizeModels(v);
        if (k) out[k] = list;
      }
    }
    return out;
  };
  const fieldsMap: Record<string, string[]> = {};
  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (!it || typeof it !== 'object') continue;
      const o = it as Record<string, unknown>;
      const nameCanon = canonicalizeFieldName(o['field_name'] ?? o['name'] ?? o['title'], String(slug));
      if (!nameCanon) continue;
      const opts = o['options'];
      if (nameCanon === 'sub') {
        const m = parseOptsMap(opts);
        if (Object.keys(m).length) return m;
      }
      const options = normalizeModels(opts);
      fieldsMap[nameCanon] = options;
    }
    return buildFlat(fieldsMap);
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj['fields'] ?? obj['data'];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (!it || typeof it !== 'object') continue;
        const o = it as Record<string, unknown>;
        const nameCanon = canonicalizeFieldName(o['field_name'] ?? o['name'] ?? o['title'], String(slug));
        if (!nameCanon) continue;
        const opts = o['options'];
        if (nameCanon === 'sub') {
          const m = parseOptsMap(opts);
          if (Object.keys(m).length) return m;
        }
        const options = normalizeModels(opts);
        fieldsMap[nameCanon] = options;
      }
      return buildFlat(fieldsMap);
    } else {
      const keys = Object.keys(obj);
      let subMap: Record<string, string[]> | null = null;
      for (const k of keys) {
        const kCanon = canonicalizeFieldName(k, String(slug)) ?? k;
        const v = obj[k];
        if (kCanon === 'sub') {
          const m = parseOptsMap(v);
          if (Object.keys(m).length) subMap = m;
        }
        fieldsMap[kCanon] = normalizeModels(v);
      }
      if (subMap) return subMap;
      return buildFlat(fieldsMap);
    }
  }
  return {};
}

export async function fetchCategoryMainSubsBatch(slugs: (CategorySlug | string)[], token?: string): Promise<Record<string, Record<string, string[]>>> {
  const tasks = slugs.map(async (s) => {
    try {
      const m = await fetchCategoryMainSubs(s, token);
      return [s, m] as const;
    } catch {
      return [s, {}] as const;
    }
  });
  const entries = await Promise.all(tasks);
  return Object.fromEntries(entries);
}

export async function postAdminCategoryFieldOptions(slug: CategorySlug | string, payload: AdminCategoryFieldUpdateRequest, token?: string): Promise<AdminCategoryFieldApiResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/category-fields/${encodeURIComponent(String(slug))}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تحديث الحقل';
    throw new Error(message);
  }
  const obj = raw as Record<string, unknown>;
  const data = obj['data'] as AdminCategoryFieldApiResponse['data'];
  const message = (obj['message'] as string) || 'تم تحديث الحقل بنجاح';
  return { message, data };
}

export async function updateCategoryFieldOptions(slug: CategorySlug | string, field_name: string, options: string[], token?: string): Promise<string[]> {
  const uniq = Array.from(new Set(options.map((x) => String(x).trim()).filter(Boolean)));
  const resp = await postAdminCategoryFieldOptions(slug, { field_name, options: uniq }, token);
  return Array.isArray(resp.data?.options) ? resp.data.options : uniq;
}

export async function fetchAdminMakesWithIds(token?: string): Promise<AdminMakeListItem[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = 'https://api.nasmasr.app/api/admin/makes';
  const res = await fetch(url, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب الماركات';
    throw new Error(message);
  }
  const out: AdminMakeListItem[] = [];
  const pushItem = (o: Record<string, unknown>) => {
    const id = typeof o['id'] === 'number' ? (o['id'] as number) : undefined;
    const nameRaw = o['name'] ?? o['make'] ?? o['brand'];
    const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? String(nameRaw).trim() : '';
    const models = normalizeModels(o['models']);
    if (typeof id === 'number' && name) out.push({ id, name, models });
  };
  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (it && typeof it === 'object') pushItem(it as Record<string, unknown>);
    }
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj['data'] ?? obj['makes'];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (it && typeof it === 'object') pushItem(it as Record<string, unknown>);
      }
    } else {
      for (const [k, v] of Object.entries(obj)) {
        const id = Number.isFinite(Number(k)) ? Number(k) : undefined;
        if (v && typeof v === 'object') {
          const o = v as Record<string, unknown>;
          const nameRaw = o['name'] ?? o['make'] ?? o['brand'];
          const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? String(nameRaw).trim() : '';
          const models = normalizeModels(o['models']);
          if (typeof id === 'number' && name) out.push({ id, name, models });
        }
      }
    }
  }
  return out;
}

export async function postAdminMake(name: string, token?: string): Promise<AdminMakeCreateResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = 'https://api.nasmasr.app/api/admin/makes';
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ name }) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر إضافة الماركة';
    throw new Error(message);
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o['id'] === 'number' ? (o['id'] as number) : 0;
  const nameOut = (o['name'] ?? name) as string;
  const models = normalizeModels(o['models']);
  const created_at = typeof o['created_at'] === 'string' ? (o['created_at'] as string) : undefined;
  const updated_at = typeof o['updated_at'] === 'string' ? (o['updated_at'] as string) : undefined;
  return { id, name: nameOut, models, created_at, updated_at } as AdminMakeCreateResponse;
}

export async function postAdminMakeModels(makeId: number, models: string[], token?: string): Promise<AdminMakeModelsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (t) headers.Authorization = `Bearer ${t}`;
  const uniq = Array.from(new Set(models.map((x) => String(x).trim()).filter(Boolean)));
  const url = `https://api.nasmasr.app/api/admin/makes/${makeId}/models`;
  const body = JSON.stringify({ models: uniq });
  const res = await fetch(url, { method: 'POST', headers, body });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر إضافة الموديلات';
    throw new Error(message);
  }
  const o = raw as Record<string, unknown>;
  const mid = typeof o['make_id'] === 'number' ? (o['make_id'] as number) : makeId;
  const list: { id: number; name: string; make_id: number; created_at?: string; updated_at?: string }[] = [];
  const arr = o['models'];
  if (Array.isArray(arr)) {
    for (const it of arr) {
      if (it && typeof it === 'object') {
        const mo = it as Record<string, unknown>;
        const id = typeof mo['id'] === 'number' ? (mo['id'] as number) : undefined;
        const name = normalizeString(mo['name']) ?? '';
        const mk = typeof mo['make_id'] === 'number' ? (mo['make_id'] as number) : mid;
        const created_at = typeof mo['created_at'] === 'string' ? (mo['created_at'] as string) : undefined;
        const updated_at = typeof mo['updated_at'] === 'string' ? (mo['updated_at'] as string) : undefined;
        if (name) list.push({ id: id ?? 0, name, make_id: mk, created_at, updated_at });
      }
    }
  }
  return { make_id: mid, models: list } as AdminMakeModelsResponse;
}

export async function addOptionRemote(slug: CategorySlug | string, field_name: string, option: string, currentOptions: string[], token?: string): Promise<string[]> {
  const next = Array.from(new Set([...currentOptions, option].map((x) => String(x).trim()).filter(Boolean)));
  return updateCategoryFieldOptions(slug, field_name, next, token);
}

export async function removeOptionRemote(slug: CategorySlug | string, field_name: string, option: string, currentOptions: string[], token?: string): Promise<string[]> {
  const next = currentOptions.filter((x) => String(x).trim() !== String(option).trim());
  return updateCategoryFieldOptions(slug, field_name, next, token);
}

export async function renameOptionRemote(slug: CategorySlug | string, field_name: string, prevOption: string, nextOption: string, currentOptions: string[], token?: string): Promise<string[]> {
  const trimmedPrev = String(prevOption).trim();
  const trimmedNext = String(nextOption).trim();
  const next = currentOptions.map((x) => (String(x).trim() === trimmedPrev ? trimmedNext : x));
  return updateCategoryFieldOptions(slug, field_name, next, token);
}

export async function fetchGovernorates(token?: string): Promise<GovernorateItem[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const adminUrl = 'https://api.nasmasr.app/api/admin/governorates';
  const publicUrl = 'https://api.nasmasr.app/api/governorates';
  let res = await fetch(t ? adminUrl : publicUrl, { method: 'GET', headers });
  let raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    if (t) {
      res = await fetch(publicUrl, { method: 'GET', headers: { Accept: 'application/json' } });
      raw = (await res.json().catch(() => null)) as unknown;
    }
    if (!res.ok || !raw) {
      const err = raw as { error?: string; message?: string } | null;
      const message = err?.error || err?.message || 'تعذر جلب المحافظات والمدن';
      throw new Error(message);
    }
  }
  const out: GovernorateItem[] = [];
  const cityIdsByGov: Record<number, Record<string, number>> = {};
  const pushGov = (o: Record<string, unknown>) => {
    const nameRaw = o['name'] ?? o['governorate'] ?? o['title'];
    const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? String(nameRaw).trim() : '';
    const citiesVal =
      o['cities']
      ?? o['city']
      ?? o['children']
      ?? o['items']
      ?? o['models']
      ?? o['data']
      ?? o['list']
      ?? o['cities_list']
      ?? o['cities_names'];
    const cities = normalizeModels(citiesVal);
    const id = typeof o['id'] === 'number' ? (o['id'] as number) : undefined;
    if (id && Array.isArray((citiesVal as unknown))) {
      const rec: Record<string, number> = cityIdsByGov[id] ?? {};
      for (const it of (citiesVal as unknown[])) {
        if (it && typeof it === 'object') {
          const ci = it as Record<string, unknown>;
          const cnameRaw = ci['name'] ?? ci['city_name'] ?? ci['title'];
          const cname = typeof cnameRaw === 'string' || typeof cnameRaw === 'number' ? String(cnameRaw).trim() : '';
          const cid = typeof ci['id'] === 'number' ? (ci['id'] as number) : (typeof ci['city_id'] === 'number' ? (ci['city_id'] as number) : undefined);
          if (cname && typeof cid === 'number') rec[cname] = cid;
        }
      }
      if (Object.keys(rec).length) cityIdsByGov[id] = rec;
    }
    if (name) out.push({ id, name, cities } as GovernorateItem);
  };
  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (it && typeof it === 'object') pushGov(it as Record<string, unknown>);
    }
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj['governorates'] ?? obj['data'];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (it && typeof it === 'object') pushGov(it as Record<string, unknown>);
      }
    } else {
      const keys = Object.keys(obj);
      for (const k of keys) {
        const v = obj[k];
        const cities = normalizeModels(v);
        if (cities.length) out.push({ name: k, cities });
      }
    }
  }
  try {
    const pubRes = await fetch(publicUrl, { method: 'GET', headers: { Accept: 'application/json' } });
    const pubRaw = (await pubRes.json().catch(() => null)) as unknown;
    const pubOut: GovernorateItem[] = [];
    const pushPub = (o: Record<string, unknown>) => {
      const nameRaw = o['name'] ?? o['governorate'] ?? o['title'];
      const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? String(nameRaw).trim() : '';
      const citiesVal =
        o['cities']
        ?? o['city']
        ?? o['children']
        ?? o['items']
        ?? o['models']
        ?? o['data']
        ?? o['list']
        ?? o['cities_list']
        ?? o['cities_names'];
      const cities = normalizeModels(citiesVal);
      if (name) pubOut.push({ name, cities } as GovernorateItem);
    };
    if (Array.isArray(pubRaw)) {
      for (const it of pubRaw) {
        if (it && typeof it === 'object') pushPub(it as Record<string, unknown>);
      }
    } else if (pubRaw && typeof pubRaw === 'object') {
      const obj = pubRaw as Record<string, unknown>;
      const arr = obj['governorates'] ?? obj['data'];
      if (Array.isArray(arr)) {
        for (const it of arr) {
          if (it && typeof it === 'object') pushPub(it as Record<string, unknown>);
        }
      } else {
        const keys = Object.keys(obj);
        for (const k of keys) {
          const v = obj[k];
          const cities = normalizeModels(v);
          if (cities.length) pubOut.push({ name: k, cities } as GovernorateItem);
        }
      }
    }
    const pubMap: Record<string, string[]> = Object.fromEntries(pubOut.map(g => [g.name, g.cities]));
    if (out.length === 0) return pubOut;
    for (const g of out) {
      const extra = pubMap[g.name] ?? [];
      if (extra.length) g.cities = Array.from(new Set([...(g.cities ?? []), ...extra]));
    }
    try {
      if (typeof window !== 'undefined') {
        const rawMap = localStorage.getItem('admin:cityIds');
        const existing: Record<number, Record<string, number>> = rawMap ? JSON.parse(rawMap) : {};
        const merged: Record<number, Record<string, number>> = { ...existing };
        for (const [gidStr, rec] of Object.entries(cityIdsByGov)) {
          const gid = Number(gidStr);
          const prev = merged[gid] ?? {};
          merged[gid] = { ...prev, ...rec };
        }
        localStorage.setItem('admin:cityIds', JSON.stringify(merged));
      }
    } catch {}
    return out;
  } catch {
    try {
      if (typeof window !== 'undefined') {
        const rawMap = localStorage.getItem('admin:cityIds');
        const existing: Record<number, Record<string, number>> = rawMap ? JSON.parse(rawMap) : {};
        const merged: Record<number, Record<string, number>> = { ...existing };
        for (const [gidStr, rec] of Object.entries(cityIdsByGov)) {
          const gid = Number(gidStr);
          const prev = merged[gid] ?? {};
          merged[gid] = { ...prev, ...rec };
        }
        localStorage.setItem('admin:cityIds', JSON.stringify(merged));
      }
    } catch {}
    return out;
  }
}

export async function postAdminGovernorates(payload: { name: string; cities: unknown[] }, token?: string): Promise<GovernorateItem[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const body = JSON.stringify({ name: payload.name, cities: payload.cities });
  const res = await fetch('https://api.nasmasr.app/api/admin/governorates', { method: 'POST', headers, body });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حفظ المحافظات والمدن';
    throw new Error(message);
  }
  const out: GovernorateItem[] = [];
  const pushGov = (o: Record<string, unknown>) => {
    const nameRaw = o['name'] ?? o['governorate'] ?? o['title'];
    const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? String(nameRaw).trim() : '';
    const citiesVal =
      o['cities']
      ?? o['city']
      ?? o['children']
      ?? o['items']
      ?? o['models']
      ?? o['data']
      ?? o['list'];
    const cities = normalizeModels(citiesVal);
    const id = typeof o['id'] === 'number' ? (o['id'] as number) : undefined;
    if (name) out.push({ id, name, cities } as GovernorateItem);
  };
  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (it && typeof it === 'object') pushGov(it as Record<string, unknown>);
    }
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj['governorates'] ?? obj['data'];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (it && typeof it === 'object') pushGov(it as Record<string, unknown>);
      }
    } else if (obj['id'] || obj['name'] || obj['cities']) {
      pushGov(obj);
    } else {
      const keys = Object.keys(obj);
      for (const k of keys) {
        const v = obj[k];
        const cities = normalizeModels(v);
        if (cities.length) out.push({ name: k, cities });
      }
    }
  }
  return out;
}

export async function createGovernorate(name: string, token?: string): Promise<GovernorateItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://api.nasmasr.app/api/admin/governorates', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر إضافة المحافظة';
    throw new Error(message);
  }
  if (Array.isArray(raw)) {
    const firstObj = raw.find((x) => {
      if (!x || typeof x !== 'object') return false;
      const r = x as Record<string, unknown>;
      return typeof r['name'] === 'string' || typeof r['name'] === 'number';
    });
    const o = (firstObj ?? {}) as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? o['id'] : undefined;
    const nameOut = (o['name'] ?? o['governorate'] ?? '') as string;
    const cities = normalizeModels(o['cities']);
    return { id, name: nameOut, cities } as GovernorateItem;
  } else if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? o['id'] : undefined;
    const nameOut = (o['name'] ?? o['governorate'] ?? '') as string;
    const cities = normalizeModels(o['cities']);
    return { id, name: nameOut, cities } as GovernorateItem;
  }
  return { name, cities: [] } as GovernorateItem;
}

export async function createCity(governorateId: number | string, name: string, token?: string): Promise<CityItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://api.nasmasr.app/api/admin/city/${governorateId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر إضافة المدينة';
    throw new Error(message);
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? o['id'] : undefined;
    const nameOut = (o['name'] ?? '') as string;
    const govId = typeof o['governorate_id'] === 'number' ? o['governorate_id'] : undefined;
    return { id, name: nameOut, governorate_id: govId } as CityItem;
  }
  return { name } as CityItem;
}

export async function fetchGovernorateById(governorateId: number | string, token?: string): Promise<GovernorateItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://api.nasmasr.app/api/admin/governorates/${governorateId}`, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب المحافظة';
    throw new Error(message);
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? o['id'] : (typeof governorateId === 'number' ? governorateId : undefined);
    const nameOut = (o['name'] ?? o['governorate'] ?? '') as string;
    const citiesVal = o['cities'] ?? o['data'] ?? o['list'] ?? o['children'];
    const cities = normalizeModels(citiesVal);
    try {
      if (typeof window !== 'undefined' && typeof id === 'number' && Array.isArray(citiesVal)) {
        const rawMap = localStorage.getItem('admin:cityIds');
        const existing: Record<number, Record<string, number>> = rawMap ? JSON.parse(rawMap) : {};
        const prev = existing[id] ?? {};
        for (const it of (citiesVal as unknown[])) {
          if (it && typeof it === 'object') {
            const ci = it as Record<string, unknown>;
            const cnameRaw = ci['name'] ?? ci['city_name'] ?? ci['title'];
            const cname = typeof cnameRaw === 'string' || typeof cnameRaw === 'number' ? String(cnameRaw).trim() : '';
            const cid = typeof ci['id'] === 'number' ? (ci['id'] as number) : (typeof ci['city_id'] === 'number' ? (ci['city_id'] as number) : undefined);
            if (cname && typeof cid === 'number') prev[cname] = cid;
          }
        }
        existing[id] = prev;
        localStorage.setItem('admin:cityIds', JSON.stringify(existing));
      }
    } catch {}
    return { id, name: nameOut, cities } as GovernorateItem;
  }
  return { name: String(governorateId), cities: [] } as GovernorateItem;
}

export async function updateCity(cityId: number | string, name: string, token?: string): Promise<CityItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://api.nasmasr.app/api/admin/cities/${cityId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name }),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تعديل المدينة';
    throw new Error(message);
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? o['id'] : (typeof cityId === 'number' ? cityId : undefined);
    const nameOut = (o['name'] ?? name) as string;
    const govId = typeof o['governorate_id'] === 'number' ? o['governorate_id'] : undefined;
    return { id, name: nameOut, governorate_id: govId } as CityItem;
  }
  return { name } as CityItem;
}

export async function deleteCity(cityId: number | string, token?: string): Promise<{ success: boolean; message?: string }> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/cities/${cityId}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حذف المدينة';
    throw new Error(message);
  }
  let msg: string | undefined = undefined;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const m = obj['message'];
    if (typeof m === 'string') msg = m;
  }
  return { success: true, message: msg };
}

export async function updateGovernorate(governorateId: number | string, name: string, token?: string): Promise<GovernorateItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://api.nasmasr.app/api/admin/governorates/${governorateId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name }),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تعديل المحافظة';
    throw new Error(message);
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? o['id'] : (typeof governorateId === 'number' ? governorateId : undefined);
    const nameOut = (o['name'] ?? name) as string;
    const cities = normalizeModels(o['cities']);
    return { id, name: nameOut, cities } as GovernorateItem;
  }
  return { name, cities: [] } as GovernorateItem;
}

export async function deleteGovernorate(governorateId: number | string, token?: string): Promise<{ success: boolean; message?: string }> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/governorates/${governorateId}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حذف المحافظة';
    throw new Error(message);
  }
  let msg: string | undefined = undefined;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const m = obj['message'];
    if (typeof m === 'string') msg = m;
  }
  return { success: true, message: msg };
}
