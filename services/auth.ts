export interface AuthUser {
  id: number;
  phone?: string;
  email?: string | null;
  role: string;
  referral_code?: string | null;
  created_at?: string;
}

export interface AuthResponse {
  message?: string;
  user?: AuthUser;
  token?: string;
  access_token?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
}

export type FieldErrors = Record<string, string[] | string>;

export class AuthError extends Error {
  fieldErrors?: FieldErrors;
  status?: number;
  constructor(message?: string, fieldErrors?: FieldErrors, status?: number) {
    super(message || 'حدث خطأ أثناء تسجيل الدخول');
    this.name = 'AuthError';
    this.fieldErrors = fieldErrors;
    this.status = status;
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => null)) as unknown as AuthResponse | null;
  if (!res.ok) {
    const d = data ?? {};
    let message: string | undefined = d.message || d.error;
    if (message) {
      const m = message.toLowerCase();
      if (res.status === 401 || m.includes('invalid credentials') || m.includes('unauthorized') || m.includes('unauthenticated')) {
        message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      }
    }
    if (!message && d.errors && typeof d.errors === 'object') {
      const parts: string[] = [];
      for (const [key, val] of Object.entries(d.errors)) {
        const label = key === 'email' ? 'البريد الإلكتروني' : key === 'password' ? 'كلمة المرور' : key;
        if (Array.isArray(val)) {
          parts.push(`${label}: ${val.join(', ')}`);
        } else if (typeof val === 'string') {
          parts.push(`${label}: ${val}`);
        }
      }
      message = parts.join(' - ');
    }
    throw new AuthError(message || 'حدث خطأ أثناء تسجيل الدخول', d.errors, res.status);
  }
  return (data ?? {}) as AuthResponse;
}
