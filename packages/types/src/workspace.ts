// Workspace-related types

import { z } from 'zod';

import { baseEntitySchema, paginationParamsSchema, paginatedResponseSchema, sortParamsSchema, uuidSchema } from './common';

// Workspace member roles
export const workspaceRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer']);
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

// AI Model preferences per workspace (defined BEFORE workspaceSettingsSchema)
export const aiModelPreferencesSchema = z.object({
  defaultChatModel: z.string().optional(),
  defaultEmbeddingModel: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
});

export type AIModelPreferences = z.infer<typeof aiModelPreferencesSchema>;

// Workspace settings (defined BEFORE workspaceSchema)
export const workspaceSettingsSchema = z.object({
  defaultDocumentVisibility: z.enum(['private', 'workspace']).default('private'),
  allowPublicSharing: z.boolean().default(false),
  retentionDays: z.number().int().positive().optional(),
  aiModelPreferences: aiModelPreferencesSchema.optional(),
});

export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;

// Workspace
export const workspaceSchema = baseEntitySchema.extend({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  ownerId: uuidSchema,
  settings: workspaceSettingsSchema.optional(),
});

export type Workspace = z.infer<typeof workspaceSchema>;

// Workspace member
export const workspaceMemberSchema = baseEntitySchema.extend({
  workspaceId: uuidSchema,
  userId: uuidSchema,
  role: workspaceRoleSchema,
  joinedAt: z.date(),
});

export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>;

// Invitation
export const workspaceInvitationSchema = baseEntitySchema.extend({
  workspaceId: uuidSchema,
  email: z.string().email(),
  role: workspaceRoleSchema,
  invitedBy: uuidSchema,
  expiresAt: z.date(),
  acceptedAt: z.date().optional(),
});

export type WorkspaceInvitation = z.infer<typeof workspaceInvitationSchema>;

// API request/response types
export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = createWorkspaceSchema.partial().extend({
  settings: workspaceSettingsSchema.partial().optional(),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export const workspaceListParamsSchema = paginationParamsSchema.merge(sortParamsSchema).extend({
  search: z.string().optional(),
  role: workspaceRoleSchema.optional(),
});

export type WorkspaceListParams = z.infer<typeof workspaceListParamsSchema>;

export const workspaceListResponseSchema = paginatedResponseSchema(workspaceSchema);
export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>;

// Member management
export const addMemberSchema = z.object({
  userId: uuidSchema,
  role: workspaceRoleSchema,
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberSchema = z.object({
  role: workspaceRoleSchema,
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: workspaceRoleSchema,
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
