/**
 * Authentication and authorization middleware for Hono.
 *
 * - requireAuth: Validates session cookie and attaches user to context.
 * - requireWorkspaceRole: Ensures user has minimum role in workspace.
 *
 * Security:
 * - Never returns passwordHash
 * - Uses timing-safe comparison for token validation
 * - Proper 401/403 responses
 */

import type { Context, Next } from 'hono';
import { validateSession, getWorkspaceMembership, hasMinimumRole, SESSION_COOKIE_NAME } from '../lib/session';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { PublicUser } from '@copilot/types';

// Extend Hono's context to carry the authenticated user
declare module 'hono' {
  interface ContextVariableMap {
    user: PublicUser;
  }
}

/**
 * Middleware: Require authenticated session.
 * Sets c.var.user with the authenticated user's public profile.
 * Returns 401 if not authenticated.
 */
export function requireAuth(db: PostgresJsDatabase) {
  return async (c: Context, next: Next) => {
    const token = parseCookie(c.req.header('cookie') ?? '', SESSION_COOKIE_NAME);

    if (!token) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const user = await validateSession(db, token);

    if (!user) {
      // Clear invalid cookie
      c.header('Set-Cookie', `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
      return c.json({ error: 'Session expired or invalid' }, 401);
    }

    c.set('user', user);
    await next();
  };
}

/**
 * Middleware: Require minimum role in a specific workspace.
 * Must be used AFTER requireAuth.
 *
 * Reads workspace ID from params (:id or :workspaceId) or query string.
 * Returns 403 if user is not a member or has insufficient role.
 */
export function requireWorkspaceRole(
  db: PostgresJsDatabase,
  minimumRole: 'viewer' | 'member' | 'admin' | 'owner' = 'member'
) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Try to get workspace ID from route params or query
    const workspaceId =
      c.req.param('id') ||
      c.req.param('workspaceId') ||
      c.req.query('workspaceId');

    if (!workspaceId) {
      return c.json({ error: 'Workspace ID is required' }, 400);
    }

    const membership = await getWorkspaceMembership(db, user.id, workspaceId);

    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    if (!hasMinimumRole(membership.role, minimumRole)) {
      return c.json(
        { error: `Insufficient permissions. Required: ${minimumRole}` },
        403
      );
    }

    await next();
  };
}

/**
 * Parse a cookie value by name from a cookie header string.
 */
function parseCookie(cookieHeader: string, name: string): string | undefined {
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : undefined;
}
