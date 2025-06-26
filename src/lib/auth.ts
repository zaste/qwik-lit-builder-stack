import type { RequestEventBase } from '@builder.io/qwik-city';
import crypto from 'crypto';

/**
 * Simple auth utilities - extend as needed
 */

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Session {
  user: User;
  expiresAt: Date;
}

// In production, use a proper session store (Redis, database, etc.)
const sessions = new Map<string, Session>();

/**
 * Create a new session
 */
export async function createSession(user: User): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour sessions
  
  sessions.set(sessionId, {
    user,
    expiresAt,
  });
  
  return sessionId;
}

/**
 * Get session from request
 */
export async function getSession(event: RequestEventBase): Promise<Session | null> {
  const sessionId = event.cookie.get('session')?.value;
  
  if (!sessionId) {
    return null;
  }
  
  const session = sessions.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  // Check if session is expired
  if (session.expiresAt < new Date()) {
    sessions.delete(sessionId);
    return null;
  }
  
  return session;
}

/**
 * Destroy a session
 */
export async function destroySession(sessionId: string): Promise<void> {
  sessions.delete(sessionId);
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return crypto
    .createHash('sha256')
    .update(password + process.env.AUTH_SECRET)
    .digest('hex');
}

/**
 * Verify a password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}