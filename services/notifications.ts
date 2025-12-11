import type { NotificationPayload, NotificationResponse } from '@/models/notifications';
import type { UsersSummaryResponse, UserSummary } from '@/models/users';

export async function sendNotification(payload: NotificationPayload, token?: string): Promise<NotificationResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://api.nasmasr.app/api/notifications', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  let raw: unknown = null;
  try { raw = await res.json(); } catch {}
  if (!res.ok || !raw || typeof raw !== 'object') {
    let message = 'تعذر إرسال الإشعار';
    if (raw && typeof raw === 'object') {
      const err = raw as { error?: string; message?: string } | null;
      message = err?.error || err?.message || message;
    } else {
      try { message = await res.text(); } catch {}
    }
    throw new Error(message);
  }
  const obj = raw as Record<string, unknown>;
  const message = String(obj['message'] || 'created');
  const data = (obj['data'] ?? {}) as NotificationResponse['data'];
  const external_sent = Boolean(obj['external_sent']);
  return { message, data, external_sent };
}

export async function fetchAllUsersSummary(
  params?: { per_page?: number; q?: string; role?: string; status?: string },
  token?: string
): Promise<UserSummary[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const base = new URL('https://api.nasmasr.app/api/admin/users-summary');
  const perPage = params?.per_page ?? 100;
  base.searchParams.set('per_page', String(perPage));
  if (params?.q) base.searchParams.set('q', params.q);
  if (params?.role) base.searchParams.set('role', params.role);
  if (params?.status) base.searchParams.set('status', params.status);
  const firstRes = await fetch(base.toString(), { method: 'GET', headers });
  const firstRaw = (await firstRes.json().catch(() => null)) as unknown;
  const first = firstRaw as UsersSummaryResponse | null;
  if (!firstRes.ok || !first) {
    const err = firstRaw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب قائمة المستخدمين');
    throw new Error(message);
  }
  const all: UserSummary[] = [...(first.users || [])];
  const lastPage = Number(first.meta?.last_page || 1);
  if (lastPage > 1) {
    const pages = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
    const promises = pages.map(async (p) => {
      const url = new URL(base.toString());
      url.searchParams.set('page', String(p));
      const res = await fetch(url.toString(), { method: 'GET', headers });
      const raw = (await res.json().catch(() => null)) as unknown;
      const data = raw as UsersSummaryResponse | null;
      if (!res.ok || !data) return [] as UserSummary[];
      return data.users || [];
    });
    const results = await Promise.all(promises);
    for (const arr of results) all.push(...arr);
  }
  return all;
}
