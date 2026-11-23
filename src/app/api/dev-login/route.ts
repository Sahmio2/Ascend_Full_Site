import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEV_SESSIONS) {
    return new NextResponse('Forbidden in production', { status: 403 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const redirectPath = url.searchParams.get('redirect') || '/account';

  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return new NextResponse('Invalid token', { status: 400 });
  }

  const response = NextResponse.redirect(new URL(redirectPath, request.url));
  response.cookies.set({
    name: 'ascend_session',
    value: token,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}
