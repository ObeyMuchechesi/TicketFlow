import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getServiceClient } from './supabase';

// Hash a password
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

// Verify a password
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

const SESSION_TTL_MS = 86400000 * 7; // 7 days

function sessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.NEXT_PUBLIC_SUPABASE_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[auth] SESSION_SECRET is not set — using a fallback secret. Set SESSION_SECRET in production.');
    }
    return 'tiketflow-session-secret-change-me-in-production';
  }
  return secret;
}

// base64url encoding avoids '+', '/', '=' — characters that commonly get
// mangled inside cookies (e.g. '+' decoded as a space by some parsers),
// which was the root cause of users being logged out immediately after login.
function toBase64Url(str) {
  return Buffer.from(str, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

// Signed session token stored in an HttpOnly cookie.
// Format: base64url(payload).base64url(hmacSignature)
export function createSessionToken(userId, role) {
  const payload = { userId, role, exp: Date.now() + SESSION_TTL_MS };
  const encoded = toBase64Url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', sessionSecret()).update(encoded).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encoded}.${sig}`;
}

export function parseSessionToken(token) {
  try {
    const [encoded, sig] = String(token || '').split('.');
    if (!encoded || !sig) return null;

    const expected = crypto.createHmac('sha256', sessionSecret()).update(encoded).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (expected !== sig) return null; // tampered token

    const payload = JSON.parse(fromBase64Url(encoded));
    if (!payload.exp || payload.exp < Date.now()) return null; // expired
    if (!payload.userId || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

// Get current user session from request cookies (sync — no DB hit)
export function getUserFromRequest(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/tf_session=([^;]+)/);
  if (!match) return null;
  return parseSessionToken(decodeURIComponent(match[1]));
}

// Require a specific role — validates the signed token AND re-checks the user
// against the database (still exists, still active, role matches). This keeps
// sessions honest even if a user is deactivated or deleted while logged in.
export async function requireRole(req, ...roles) {
  const session = getUserFromRequest(req);
  if (!session) throw { status: 401, message: 'Not authenticated' };

  const supabase = getServiceClient();
  const { data: user } = await supabase
    .from('users')
    .select('id, role, is_active')
    .eq('id', session.userId)
    .single();

  if (!user || user.is_active === false) throw { status: 401, message: 'Session expired or account deactivated' };
  if (roles.length && !roles.includes(user.role)) {
    throw { status: 403, message: 'Insufficient permissions' };
  }

  return { userId: user.id, role: user.role };
}
