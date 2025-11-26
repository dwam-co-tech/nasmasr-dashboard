import type { CarMakesResponse, MakeItem, CategoryField, GovernorateItem, CityItem, CategorySlug, CategoryFieldMapBySlug } from '@/models/makes';

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
  const urlOld = `https://api.nasmasr.app/api/category-fields?category_slug=${encodeURIComponent(categorySlug)}`;
  const urlNew = `https://api.nasmasr.app/api/api/category-fields?category_slug=${encodeURIComponent(categorySlug)}`;
  let res = await fetch(urlOld, { method: 'GET', headers });
  let raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    res = await fetch(urlNew, { method: 'GET', headers });
    raw = (await res.json().catch(() => null)) as unknown;
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
        const name = (o['field_name'] ?? o['name'] ?? o['title']) as string | undefined;
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
          const name = (o['field_name'] ?? o['name'] ?? o['title']) as string | undefined;
          const options = normalizeOptions(o['options']);
          if (name) out.push({ field_name: name, options });
        }
      }
    } else {
      const keys = Object.keys(obj);
      for (const k of keys) {
        const v = obj[k];
        const options = normalizeOptions(v);
        if (options.length) out.push({ field_name: k, options });
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
