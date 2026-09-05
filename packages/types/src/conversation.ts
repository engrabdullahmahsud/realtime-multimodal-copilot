// Conversation-related types

import { z } from 'zod';
import { baseEntitySchema, paginationParamsSchema, paginatedResponseSchema, sortParamsSchema, uuidSchema } from './common';

// Message role
export const messageRoleSchema = z.enum(['user', 'assistant', 'system', 'tool']);
export type MessageRole = z.infer<typeof messageRoleSchema>;

// Message content types
export const messageContentTypeSchema = z.enum(['text', 'image', 'audio', 'file', 'tool_call', 'tool_result']);
export type MessageContentType = z.infer<typeof messageContentTypeSchema>;

// Message content (multimodal)
export const messageContentSchema = z.object({
  type: messageContentTypeSchema,
  text: z.string().optional(),
  imageUrl: z.string().url().optional(),
  audioUrl: z.string().url().optional(),
  fileId: uuidSchema.optional(),
  fileName: z.string().optional(),
  toolCallId: z.string().optional(),
  toolName: z.string().optional(),
  toolArguments: z.record(z.unknown()).optional(),
  toolResult: z.unknown().optional(),
});

export type MessageContent = z.infer<typeof messageContentSchema>;

// Citation
export const citationSchema = z.object({
  documentId: uuidSchema,
  documentName: z.string(),
  chunkId: uuidSchema,
  chunkSequence: z.number().int().nonnegative(),
  content: z.string(),
  score: z.number().min(0).max(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Citation = z.infer<typeof citationSchema>;

// Conversation settings (defined BEFORE conversationSchema to avoid forward reference)
export const conversationSettingsSchema = z.object({
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().default(4096),
  retrievalEnabled: z.boolean().default(true),
  maxRetrievedChunks: z.number().int().positive().max(20).default(5),
  similarityThreshold: z.number().min(0).max(1).default(0.7),
  citationStyle: z.enum(['inline', 'footer', 'sidebar']).default('inline'),
  streamResponse: z.boolean().default(true),
});

export type ConversationSettings = z.infer<typeof conversationSettingsSchema>;

// Message
export const messageSchema = baseEntitySchema.extend({
  conversationId: uuidSchema,
  role: messageRoleSchema,
  content: z.array(messageContentSchema).min(1),
  citations: z.array(citationSchema).optional(),
  model: z.string().optional(),
  tokensUsed: z.number().int().nonnegative().optional(),
  processingTimeMs: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Message = z.infer<typeof messageSchema>;

// Conversation
export const conversationSchema = baseEntitySchema.extend({
  workspaceId: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  ownerId: uuidSchema,
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  settings: conversationSettingsSchema.optional(),
  messageCount: z.number().int().nonnegative().default(0),
  lastMessageAt: z.date().optional(),
  archivedAt: z.date().optional(),
});

export type Conversation = z.infer<typeof conversationSchema>;

// API request/response types
export const createConversationSchema = z.object({
  workspaceId: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  ownerId: uuidSchema,
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  settings: conversationSettingsSchema.partial().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const updateConversationSchema = createConversationSchema.partial().omit({ workspaceId: true });
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;

export const conversationListParamsSchema = paginationParamsSchema.merge(sortParamsSchema).extend({
  search: z.string().optional(),
  archived: z.boolean().optional(),
});

export type ConversationListParams = z.infer<typeof conversationListParamsSchema>;

export const conversationListResponseSchema = paginatedResponseSchema(conversationSchema);
export type ConversationListResponse = z.infer<typeof conversationListResponseSchema>;

// Message creation
export const createMessageSchema = z.object({
  conversationId: uuidSchema,
  role: messageRoleSchema,
  content: z.array(messageContentSchema).min(1),
  // For user messages, optionally specify which documents to include in context
  documentIds: z.array(uuidSchema).optional(),
  citations: z.array(citationSchema).optional(),
  model: z.string().optional(),
  tokensUsed: z.number().int().nonnegative().optional(),
  processingTimeMs: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

// Streaming message delta
export const messageDeltaSchema = z.object({
  type: z.enum(['content', 'citation', 'done', 'error']),
  content: z.string().optional(),
  citation: citationSchema.optional(),
  error: z.string().optional(),
});

export type MessageDelta = z.infer<typeof messageDeltaSchema>;

// Retrieval context (what the AI has access to)
export const retrievalContextSchema = z.object({
  documentIds: z.array(uuidSchema),
  chunks: z.array(z.object({
    id: uuidSchema,
    documentId: uuidSchema,
    documentName: z.string(),
    content: z.string(),
    score: z.number().min(0).max(1),
    metadata: z.record(z.unknown()).optional(),
  })),
  query: z.string(),
  totalChunksConsidered: z.number().int().nonnegative(),
  retrievalTimeMs: z.number().int().nonnegative(),
});

export type RetrievalContext = z.infer<typeof retrievalContextSchema>;
