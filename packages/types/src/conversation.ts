// Conversation-related types

import { z } from 'zod';

import { baseEntitySchema, paginationParamsSchema, paginatedResponseSchema, sortParamsSchema, uuidSchema } from './common';

// Conversation
export const conversationSchema = baseEntitySchema.extend({
  workspaceId: uuidSchema,
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  ownerId: uuidSchema,
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
  messageCount: z.number().int().nonnegative().default(0),
  lastMessageAt: z.date().optional(),
  archivedAt: z.date().optional(),
});

export type Conversation = z.infer<typeof conversationSchema>;

// API request/response types
export const createConversationSchema = z.object({
  workspaceId: uuidSchema,
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const updateConversationSchema = createConversationSchema.partial().omit({ workspaceId: true });
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;

export const conversationListParamsSchema = paginationParamsSchema.merge(sortParamsSchema).extend({
  search: z.string().optional(),
  archived: z.boolean().optional(),
  workspaceId: uuidSchema.optional(),
});

export type ConversationListParams = z.infer<typeof conversationListParamsSchema>;

export const conversationListResponseSchema = paginatedResponseSchema(conversationSchema);
export type ConversationListResponse = z.infer<typeof conversationListResponseSchema>;

// Message creation
export const createMessageSchema = z.object({
  conversationId: uuidSchema,
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.array(z.object({
    type: z.enum(['text', 'image', 'file']),
    text: z.string().optional(),
    url: z.string().url().optional(),
  })).min(1),
  model: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export const messageListParamsSchema = paginationParamsSchema.merge(sortParamsSchema).extend({
  conversationId: uuidSchema.optional(),
});

export type MessageListParams = z.infer<typeof messageListParamsSchema>;

export const messageListResponseSchema = paginatedResponseSchema(z.object({
  id: uuidSchema,
  conversationId: uuidSchema,
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.array(z.object({
    type: z.enum(['text', 'image', 'file']),
    text: z.string().optional(),
    url: z.string().url().optional(),
  })),
  citations: z.array(z.object({
    documentId: uuidSchema,
    documentName: z.string(),
    chunkIndex: z.number().int(),
    text: z.string(),
  })).optional(),
  model: z.string().optional(),
  tokensUsed: z.number().int().optional(),
  processingTimeMs: z.number().int().optional(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
}));

export type MessageListResponse = z.infer<typeof messageListResponseSchema>;

// AI Response
export const aiResponseSchema = z.object({
  conversationId: uuidSchema,
  message: z.string().min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
});

export type AIResponseInput = z.infer<typeof aiResponseSchema>;
