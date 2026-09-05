/**
 * Authentication routes.
 *
 * POST /auth/register  — Create new account
 * POST /auth/login     — Authenticate and create session
 * POST /auth/logout    — Invalidate session
 * GET  /auth/me        — Get current user profile
 *
 * Security:
 * - Passwords are hashed with scrypt (never stored in plaintext)
 * - Passwords are NEVER returned in API responses
 * - Session tokens are HTTP-only, Secure, SameSite=Strict cookies
 * - Rate limiting should be added in production
 */

import type { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { users } from '@copilot/types/database';
import { registerSchema, loginSchema } from '@copilot/types';
import { hashPassword, verifyPassword } from '../lib/password';
import { createSession, deleteSession, SESSION_COOKIE_NAME } from '../lib/session';
import { requireAuth } from '../middleware/auth';

export function authRoutes(app: Hono, db: PostgresJsDatabase) {
  // ── Register ────────────────────────────────────────────────

  app.post('/auth/register', async (c) => {
    try {
      const body = await c.req.json();
      const validated = registerSchema.safeParse(body);

      if (!validated.success) {
        return c.json(
          { error: 'Invalid input', details: validated.error.format() },
          400
        );
      }

      const { email, name, password } = validated.data;

      // Check if user already exists
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        return c.json({ error: 'An account with this email already exists' }, 409);
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const [user] = await db
        .insert(users)
        .values({
          email,
          name,
          passwordHash,
        })
        .returning();

      if (!user) {
        return c.json({ error: 'Failed to create account' }, 500);
      }

      // Create session
      const { token, expiresAt } = await createSession(db, user.id);

      // Set session cookie
      c.header(
        'Set-Cookie',
        buildSessionCookie(token, expiresAt)
      );

      return c.json(
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
          },
          sessionExpiresAt: expiresAt.toISOString(),
        },
        201
      );
    } catch (error) {
      console.error('Error during registration:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // ── Login ───────────────────────────────────────────────────

  app.post('/auth/login', async (c) => {
    try {
      const body = await c.req.json();
      const validated = loginSchema.safeParse(body);

      if (!validated.success) {
        return c.json(
          { error: 'Invalid input', details: validated.error.format() },
          400
        );
      }

      const { email, password } = validated.data;

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      // Use same error for both "user not found" and "wrong password"
      // to prevent email enumeration
      if (!user) {
        // Perform dummy hash to prevent timing-based user enumeration
        await hashPassword('dummy-password-to-prevent-timing-leak');
        return c.json({ error: 'Invalid email or password' }, 401);
      }

      const valid = await verifyPassword(password, user.passwordHash);

      if (!valid) {
        return c.json({ error: 'Invalid email or password' }, 401);
      }

      // Create session
      const { token, expiresAt } = await createSession(db, user.id);

      // Set session cookie
      c.header(
        'Set-Cookie',
        buildSessionCookie(token, expiresAt)
      );

      return c.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        sessionExpiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error('Error during login:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // ── Logout ──────────────────────────────────────────────────

  app.post('/auth/logout', async (c) => {
    try {
      const token = parseCookie(c.req.header('cookie') ?? '', SESSION_COOKIE_NAME);

      if (token) {
        await deleteSession(db, token);
      }

      // Clear cookie regardless
      c.header(
        'Set-Cookie',
        `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
      );

      return c.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Error during logout:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // ── Current User ────────────────────────────────────────────

  app.get('/auth/me', requireAuth(db), async (c) => {
    const user = c.get('user');
    return c.json({ user });
  });
}

// ── Helpers ─────────────────────────────────────────────────────

function buildSessionCookie(token: string, expiresAt: Date): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Expires=${expiresAt.toUTCString()}`,
  ];

  // Only add Secure in production (allows HTTP in development)
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function parseCookie(cookieHeader: string, name: string): string | undefined {
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : undefined;
}
