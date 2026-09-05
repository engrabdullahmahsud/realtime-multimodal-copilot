import {
  pgTable,
  text,
  uuid,
  json,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// Enums (type-safe, enforced at DB level)
// ============================================================

export const messageRoleEnum = pgEnum('message_role', [
  'user',
  'assistant',
  'system',
  'tool',
]);

export const documentStatusEnum = pgEnum('document_status', [
  'uploading',
  'processing',
  'ready',
  'error',
  'archived',
]);

export const documentVisibilityEnum = pgEnum('document_visibility', [
  'private',
  'workspace',
  'public',
]);

export const workspaceMemberRoleEnum = pgEnum('workspace_member_role', [
  'owner',
  'admin',
  'member',
  'viewer',
]);

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'revoked',
]);

// ============================================================
// Tables
// ============================================================

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').default(false),
  environment: text('environment').default('development'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

// Workspaces table
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  defaultDocumentVisibility: text('default_document_visibility').default('private'),
  allowPublicSharing: boolean('allow_public_sharing').default(false),
  retentionDays: integer('retention_days'),
  aiModelPreferences: json('ai_model_preferences'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex('workspaces_slug_idx').on(table.slug),
  ownerIdx: index('workspaces_owner_id_idx').on(table.ownerId),
}));

// Workspace members
export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').default('member'),
  joinedAt: timestamp('joined_at').defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workspaceUserIdx: uniqueIndex('workspace_members_workspace_user_idx').on(table.workspaceId, table.userId),
  userIdx: index('workspace_members_user_id_idx').on(table.userId),
}));

// Documents table
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index('documents_workspace_id_idx').on(table.workspaceId),
  ownerIdx: index('documents_owner_id_idx').on(table.ownerId),
  statusIdx: index('documents_status_idx').on(table.status),
}));

// Document chunks (for RAG)
export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  tokenCount: integer('token_count').notNull(),
  sequence: integer('sequence').notNull(),
  metadata: json('metadata'),
  embedding: text('embedding'), // Placeholder for pgvector; stored as JSON string
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  documentIdx: index('document_chunks_document_id_idx').on(table.documentId),
  workspaceIdx: index('document_chunks_workspace_id_idx').on(table.workspaceId),
}));

// Workspace invitations
export const workspaceInvitations = pgTable('workspace_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').default('member'),
  status: text('status').default('pending'),
  invitedBy: uuid('invited_by').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at'),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index('workspace_invitations_workspace_id_idx').on(table.workspaceId),
  emailIdx: index('workspace_invitations_email_idx').on(table.email),
}));

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  model: text('model'),
  systemPrompt: text('system_prompt'),
  settings: json('settings'),
  messageCount: integer('message_count').default(0),
  lastMessageAt: timestamp('last_message_at'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index('conversations_workspace_id_idx').on(table.workspaceId),
  ownerIdx: index('conversations_owner_id_idx').on(table.ownerId),
  lastMessageIdx: index('conversations_last_message_at_idx').on(table.lastMessageAt),
}));

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: json('content').notNull(),
  citations: json('citations'),
  model: text('model'),
  tokensUsed: integer('tokens_used'),
  processingTimeMs: integer('processing_time_ms'),
  error: text('error'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  conversationIdx: index('messages_conversation_id_idx').on(table.conversationId),
  roleIdx: index('messages_role_idx').on(table.role),
}));

// Sessions table (authentication)
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tokenIdx: uniqueIndex('sessions_token_idx').on(table.token),
  userIdx: index('sessions_user_id_idx').on(table.userId),
}));

// ============================================================
// Relations
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  workspaceMembers: many(workspaceMembers),
  documents: many(documents),
  conversations: many(conversations),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  documents: many(documents),
  conversations: many(conversations),
  invitations: many(workspaceInvitations),
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

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, { fields: [documentChunks.documentId], references: [documents.id] }),
  workspace: one(workspaces, { fields: [documentChunks.workspaceId], references: [workspaces.id] }),
}));

export const workspaceInvitationsRelations = relations(workspaceInvitations, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceInvitations.workspaceId], references: [workspaces.id] }),
  invitedBy: one(users, { fields: [workspaceInvitations.invitedBy], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ many, one }) => ({
  workspace: one(workspaces, { fields: [conversations.workspaceId], references: [workspaces.id] }),
  owner: one(users, { fields: [conversations.ownerId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}));
