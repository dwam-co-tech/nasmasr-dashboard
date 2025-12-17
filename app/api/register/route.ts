import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const baseUrl = process.env.LARAVEL_API_URL;
    if (!baseUrl) {
      return NextResponse.json({ message: 'Missing LARAVEL_API_URL' }, { status: 500 });
    }
    const url = baseUrl.endsWith('/') ? `${baseUrl}register` : `${baseUrl}/register`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      const obj = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
      const msg = typeof obj.message === 'string' ? obj.message : typeof obj.error === 'string' ? obj.error : null;
      const message = msg ?? 'فشل تسجيل الدخول';
      return NextResponse.json(
        { message, data },
        { status: res.status }
      );
    }

    return NextResponse.json(data ?? { success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'خطأ داخلي' }, { status: 500 });
  }
}
