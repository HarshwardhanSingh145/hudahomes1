import { NextRequest, NextResponse } from 'next/server';
import {
  readCatalogStore,
  writeCatalogStore,
  hashPin,
  createAdminSessionToken,
  isRequestAuthorized,
} from '@/lib/catalog-store';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '@/lib/firebase';

function applySessionCookie(res: NextResponse, token: string, maxAgeSeconds: number) {
  res.cookies.set('huda_admin_session', token, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export async function GET(req: NextRequest) {
  const authenticated = isRequestAuthorized(req);
  return NextResponse.json({ authenticated });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, pin, currentPin, newPin, email } = body;

    const store = readCatalogStore();

    // Update PIN action (requires valid current session and currentPin match)
    if (action === 'change-pin') {
      if (!isRequestAuthorized(req)) {
        return NextResponse.json(
          { error: 'Unauthorized. Please log in first.' },
          { status: 401 }
        );
      }

      if (!currentPin || hashPin(String(currentPin)) !== store.adminPinHash) {
        return NextResponse.json(
          { error: 'Current password/PIN is incorrect.' },
          { status: 403 }
        );
      }

      if (!newPin || String(newPin).trim().length < 4) {
        return NextResponse.json(
          { error: 'New password/PIN must be at least 4 characters.' },
          { status: 400 }
        );
      }

      const newHash = hashPin(String(newPin));
      store.adminPinHash = newHash;
      writeCatalogStore(store);

      const newToken = createAdminSessionToken(newHash);
      const res = NextResponse.json({
        success: true,
        authenticated: true,
        token: newToken,
        message: 'Admin password/PIN updated successfully.',
      });
      applySessionCookie(res, newToken, 60 * 60 * 24 * 7);
      return res;
    }

    // Issue server session token for verified Firebase Owner account
    if (action === 'firebase-owner-session') {
      if (
        typeof email === 'string' &&
        email.trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
      ) {
        const token = createAdminSessionToken(store.adminPinHash);
        const res = NextResponse.json({
          authenticated: true,
          token,
          message: 'Studio Owner Google session linked.',
        });
        applySessionCookie(res, token, 60 * 60 * 24 * 7);
        return res;
      }
      return NextResponse.json(
        { error: 'Only the verified Studio Owner account can claim an admin session.' },
        { status: 403 }
      );
    }

    // Standard login action
    if (!pin || typeof pin !== 'string') {
      return NextResponse.json(
        { error: 'Please enter the admin password/PIN.' },
        { status: 400 }
      );
    }

    const candidateHash = hashPin(pin);
    if (candidateHash !== store.adminPinHash) {
      return NextResponse.json(
        { error: 'Incorrect password/PIN. Access denied.' },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken(store.adminPinHash);
    const response = NextResponse.json({
      authenticated: true,
      token,
      message: 'Welcome to HUDA HOMES Admin Dashboard.',
    });

    applySessionCookie(response, token, 60 * 60 * 24 * 7);

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid authentication request.' },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    authenticated: false,
    message: 'Logged out successfully.',
  });
  applySessionCookie(response, '', 0);
  return response;
}
