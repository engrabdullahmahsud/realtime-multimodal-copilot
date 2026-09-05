// Common shared types used across the platform

import { z } from 'zod';

// Base entity fields
export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BaseEntity = z.infer<typeof baseEntitySchema>;

// Pagination
export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Sorting
export const sortParamsSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type SortParams = z.infer<typeof sortParamsSchema>;

// API Error responses
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
  requestId: z.string().uuid().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

// API Success response wrapper
export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z.record(z.unknown()).optional(),
  });

export type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

// Union type for API responses
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([
    apiSuccessSchema(dataSchema),
    apiErrorSchema,
  ]);

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ID types
export const uuidSchema = z.string().uuid();
export type UUID = z.infer<typeof uuidSchema>;

// Timestamp helpers
export const timestampSchema = z.string().datetime();
export type Timestamp = z.infer<typeof timestampSchema>;

// Environment types
export const environmentSchema = z.enum(['development', 'staging', 'production']);
export type Environment = z.infer<typeof environmentSchema>;

// Feature flags (future)
export const featureFlagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
});

export type FeatureFlag = z.infer<typeof featureFlagSchema>;