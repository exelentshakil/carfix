export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '@/lib/adminAuth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    const isValid = verifyAdminSessionToken(sessionToken);
    return NextResponse.json({ authenticated: isValid });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (!configuredPassword) {
      console.warn('ADMIN_PASSWORD environment variable is not set on the server.');
      return NextResponse.json(
        { error: 'ADMIN_PASSWORD is not configured on the server. Please add ADMIN_PASSWORD to .env.local.' },
        { status: 500 }
      );
    }

    if (!password || password !== configuredPassword) {
      return NextResponse.json(
        { error: 'Incorrect admin password. Access denied.' },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken();
    const cookieStore = await cookies();

    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, message: 'Authentication successful.' });
  } catch (err: any) {
    console.error('Admin authentication error:', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return NextResponse.json({ success: true, message: 'Logged out.' });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
