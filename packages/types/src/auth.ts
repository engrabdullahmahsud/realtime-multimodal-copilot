// Authentication & Authorization types

import { z } from 'zod';

// ── Registration ──────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ── Login ─────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Public user (returned by API — NEVER includes passwordHash) ──

export const publicUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().url().nullable().optional(),
  emailVerified: z.boolean().nullable().optional(),
  createdAt: z.date(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

// ── Auth response ─────────────────────────────────────────────

export const authResponseSchema = z.object({
  user: publicUserSchema,
  sessionExpiresAt: z.string().datetime(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
