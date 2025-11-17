import type { UsersSummaryResponse } from '@/models/users';

export async function fetchUsersSummary(token?: string): Promise<UsersSummaryResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://api.nasmasr.app/api/admin/users-summary', { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as UsersSummaryResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب قائمة المستخدمين');
    throw new Error(message);
  }
  return data;
}