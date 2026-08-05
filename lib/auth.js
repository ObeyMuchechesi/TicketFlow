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

// Simple session token stored in cookie (in production use NextAuth or Supabase Auth)
export function createSessionToken(userId, role) {
  const payload = JSON.stringify({ userId, role, exp: Date.now() + 86400000 * 7 });
  return Buffer.from(payload).toString('base64');
}

export function parseSessionToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Get current user from request cookies
export function getUserFromRequest(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/tf_session=([^;]+)/);
  if (!match) return null;
  return parseSessionToken(decodeURIComponent(match[1]));
}

// Require a specific role — returns user or throws
export async function requireRole(req, ...roles) {
  const user = getUserFromRequest(req);
  if (!user) throw { status: 401, message: 'Not authenticated' };
  if (roles.length && !roles.includes(user.role)) {
    throw { status: 403, message: 'Insufficient permissions' };
  }
  return user;
}
