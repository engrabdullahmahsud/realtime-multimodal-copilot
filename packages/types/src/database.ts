import { pgTable, pgSchema, text, uuid, json, integer, boolean, date, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Copy of the base entity fields used in Zod schemas
const baseEntity = {
  id: uuid('id').primaryKey(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
};

// Schema namespace
const copilot = pgSchema('copilot', { useSchema: true, searchPath: 'public' });

// Users table (auth/authorization layer - future)
export const users = pgTable('users', {
  ...baseEntity,
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  environment: text('environment').default('development'),
});

// Workspaces table
export const workspaces = pgTable('workspaces', {
  ...baseEntity,
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  defaultDocumentVisibility: text('default_document_visibility').default('private'),
  allowPublicSharing: boolean('allow_public_sharing').default(false),
  retentionDays: integer('retention_days'),
  aiModelPreferences: json('ai_model_preferences'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
});

// Workspace members
export const workspaceMembers = pgTable('workspace_members', {
  ...baseEntity,
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: text('role').default('member'),
  joinedAt: timestamp('joined_at').defaultNow(),
);

// Documents table
export const documents = pgTable('documents', {
  ...baseEntity,
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  originalName: text('original_name').notNull(),
  type: text('type').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  status: text('status').default('uploading'),
  visibility: text('visibility').default('private'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  storagePath: text('storage_path'),
  checksum: text('checksum'),
  metadata: json('metadata'),
  processingError: text('processing_error'),
  processedAt: timestamp('processed_at'),
});

// Document chunks (for RAG)
export const documentChunks = pgTable('document_chunks', {
  ...baseEntity,
  documentId: uuid('document_id').notNull().references(() => documents.id),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  content: text('content').notNull(),
  tokenCount: integer('token_count').notNull(),
  sequence: integer('sequence').notNull(),
  metadata: json('metadata'),
  embedding: text('embedding'), // Stored as JSON string or pgvector
});

// Workspace invitations
export const workspaceInvitations = pgTable('workspace_invitations', {
  ...baseEntity,
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  email: text('email').notNull(),
  role: text('role').default('member'),
  invitedBy: uuid('invited_by').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at'),
  acceptedAt: timestamp('accepted_at'),
});

// Conversations table
export const conversations = pgTable('conversations', {
  ...baseEntity,
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  title: text('title').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  model: text('model'),
  systemPrompt: text('systemPrompt'),
  settings: json('settings'),
  messageCount: integer('messageCount').default(0),
  lastMessageAt: timestamp('lastMessage_at'),
  archivedAt: timestamp('archived_at'),
});

// Messages table
export const messages = pgTable('messages', {
  ...baseEntity,
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id),
  role: text('role').notNull(),
  content: json('content').notNull(),
  citations: json('citations'),
  model: text('model'),
  tokensUsed: integer('tokens_used'),
  processingTimeMs: integer('processing_time_ms'),
  error: text('error'),
  metadata: json('metadata'),
});

// Relations (for JOIN queries)
export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  workspaceMembers: many(workspaceMembers),
  documents: many(documents),
  conversations: many(conversations),
  messages: many(messages),
}));

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  documents: many(documents),
  conversations: many(conversations),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [documents.workspaceId], references: [workspaces.id] }),
  owner: one(users, { fields: [documents.ownerId], references: [users.id] }),
  chunks: many(documentChunks),
}));

export const conversationRelations = relations(conversations, ({ many, one }) => ({
  workspace: one(workspaces, { fields: [conversations.workspaceId], references: [workspaces.id] }),
  owner: one(users, { fields: [conversations.ownerId], references: [users.id] }),
  messages: many(messages),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}));

// Document chunks relations
export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, { fields: [documentChunks.documentId], references: [documents.id] }),
  workspace: one(workspaces, { fields: [documentChunks.workspaceId], references: [workspaces.id] }),
}));
