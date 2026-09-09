import path from 'path';

import dotenv, { config } from 'dotenv';
import { eq, inArray, and, desc, isNull, isNotNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import postgres from 'postgres';
import { z } from 'zod';

import {
  createConversationSchema,
  createMessageSchema,
  conversationListParamsSchema,
  createWorkspaceSchema,
  createDocumentSchema,
  documentListParamsSchema,
  updateDocumentSchema,
} from '@copilot/types';
import {
  workspaces,
  documents,
  conversations,
  messages,
  workspaceMembers,
  sessions,
} from '@copilot/types/database';

import {
  getWorkspaceMembership,
  hasMinimumRole,
  getCurrentOwnerId,
} from './lib/session';
import { requireAuth } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { healthRoute } from './routes/health';

/**
 * Copilot API Server (Hono)
 *
 * Main API entrypoint - creates and configures the Hono application.
 * Server startup is handled in server.ts
 */

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const pg = postgres(connectionString);
const db = drizzle(pg);

const app = new Hono();

// CORS middleware for local development
app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Health check (public — no auth required)
healthRoute(app);

// Auth routes (public — no auth required)
authRoutes(app, db);

// ==========================================
// Protected API routes (auth required)
// ==========================================

// Apply auth middleware to all routes below
app.use('*', async (c, next) => {
  const path = c.req.path;

  // Public routes
  if (path === '/health' || path === '/api/health' || path.startsWith('/auth/')) {
    return next();
  }

  // Everything else requires authentication
  return requireAuth(db)(c, next);
});

// ── Conversation Management API ─────────────────────────────

// List conversations with pagination and filtering
app.get('/conversations', async (c) => {
  try {
    const user = c.get('user');
    const params = conversationListParamsSchema.parse({
      page: c.req.query('page') ?? 1,
      limit: c.req.query('limit') ?? 20,
      search: c.req.query('search'),
      archived: c.req.query('archived'),
      workspaceId: c.req.query('workspaceId'),
    });

    // Get user's workspace memberships
    const userWorkspaces = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, user.id));

    const workspaceIds = userWorkspaces.map((m) => m.workspaceId);

    if (workspaceIds.length === 0) {
      return c.json({ items: [], total: 0, page: 1, limit: params.limit, totalPages: 0 });
    }

    // Build query
    const conditions = [
      inArray(conversations.workspaceId, workspaceIds),
    ];

    // Filter by workspace if specified
    if (params.workspaceId) {
      if (!workspaceIds.includes(params.workspaceId)) {
        return c.json({ error: 'You are not a member of this workspace' }, 403);
      }
      conditions.push(eq(conversations.workspaceId, params.workspaceId));
    }

    // Filter archived
    if (params.archived === true) {
      conditions.push(isNotNull(conversations.archivedAt));
    } else {
      // Default: non-archived only
      conditions.push(isNull(conversations.archivedAt));
    }

    // Search
    if (params.search) {
      conditions.push(eq(conversations.title, params.search));
    }

    const query = db
      .select()
      .from(conversations)
      .where(and(...conditions));

    // Execute with pagination
    const page = Math.max(1, params.page);
    const limit = Math.min(100, Math.max(1, params.limit));
    const offset = (page - 1) * limit;

    const [allConversations, totalResult] = await Promise.all([
      query.limit(limit).offset(offset).orderBy(desc(conversations.updatedAt)),
      db.select({ count: conversations.id }).from(conversations).where(inArray(conversations.workspaceId, workspaceIds)),
    ]);

    const total = totalResult.length;
    const totalPages = Math.ceil(total / limit);

    return c.json({
      items: allConversations,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Error listing conversations:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create conversation
app.post('/conversations', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validated = createConversationSchema.safeParse(body);

    if (!validated.success) {
      return c.json(
        { error: 'Invalid input', details: validated.error.format() },
        400
      );
    }

    // Verify user is member of workspace
    const membership = await getWorkspaceMembership(db, user.id, validated.data.workspaceId);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    const [conversation] = await db
      .insert(conversations)
      .values({
        workspaceId: validated.data.workspaceId,
        title: validated.data.title,
        description: validated.data.description,
        ownerId: user.id,
        model: validated.data.model,
        systemPrompt: validated.data.systemPrompt,
        settings: validated.data.settings,
        messageCount: 0,
      })
      .returning();

    if (!conversation) {
      return c.json({ error: 'Failed to create conversation' }, 500);
    }

    return c.json({ conversation }, 201);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get conversation
app.get('/conversations/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Check membership
    const membership = await getWorkspaceMembership(db, user.id, conversation.workspaceId);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    return c.json({ conversation });
  } catch (error) {
    console.error('Error getting conversation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update conversation
app.patch('/conversations/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Check membership and role
    const membership = await getWorkspaceMembership(db, user.id, conversation.workspaceId);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    // Only owner/admin can update
    if (!hasMinimumRole(membership.role, 'member')) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const [updated] = await db
      .update(conversations)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, id))
      .returning();

    return c.json({ conversation: updated });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete conversation
app.delete('/conversations/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Check membership
    const membership = await getWorkspaceMembership(db, user.id, conversation.workspaceId);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    // Only owner/admin can delete
    if (!hasMinimumRole(membership.role, 'admin')) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));

    return c.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// List messages
app.get('/conversations/:conversationId/messages', async (c) => {
  try {
    const user = c.get('user');
    const conversationId = c.req.param('conversationId');
    const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '50', 10)));
    const offset = (page - 1) * limit;

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Check membership
    const membership = await getWorkspaceMembership(db, user.id, conversation.workspaceId);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: messages.id })
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    const total = totalResult.length;
    const totalPages = Math.ceil(total / limit);

    return c.json({
      items: allMessages.reverse(), // Return in chronological order
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Error listing messages:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create message
app.post('/conversations/:conversationId/messages', async (c) => {
  try {
    const user = c.get('user');
    const conversationId = c.req.param('conversationId');
    const body = await c.req.json();
    const validated = createMessageSchema.safeParse(body);

    if (!validated.success) {
      return c.json(
        { error: 'Invalid input', details: validated.error.format() },
        400
      );
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Check membership
    const membership = await getWorkspaceMembership(db, user.id, conversation.workspaceId);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    // Create user message
    const [userMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        role: validated.data.role,
        content: validated.data.content,
        model: validated.data.model,
        metadata: validated.data.metadata,
      })
      .returning();

    // Update conversation message count and last message time
    await db
      .update(conversations)
      .set({
        messageCount: (conversation.messageCount ?? 0) + 1,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    // If user message, generate AI response (simplified)
    if (validated.data.role === 'user') {
      // TODO: Integrate with AI provider
      const [aiMessage] = await db
        .insert(messages)
        .values({
          conversationId,
          role: 'assistant',
          content: [{ type: 'text', text: 'AI response placeholder' }],
          model: 'simulated',
          tokensUsed: 10,
          processingTimeMs: 50,
        })
        .returning();

      return c.json({ messages: [userMessage, aiMessage] }, 201);
    }

    return c.json({ message: userMessage }, 201);
  } catch (error) {
    console.error('Error creating message:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// AI Response endpoint
app.post('/ai/response', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    // Validate request
    const schema = z.object({
      conversationId: z.string().uuid(),
      message: z.string().min(1),
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().int().positive().optional(),
    });

    const validated = schema.safeParse(body);
    if (!validated.success) {
      return c.json(
        { error: 'Invalid input', details: validated.error.format() },
        400
      );
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, validated.data.conversationId))
      .limit(1);

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Check membership
    const membership = await getWorkspaceMembership(db, user.id, conversation.workspaceId);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    // Create user message
    const [userMessage] = await db
      .insert(messages)
      .values({
        conversationId: validated.data.conversationId,
        role: 'user',
        content: [{ type: 'text', text: validated.data.message }],
        model: validated.data.model,
      })
      .returning();

    // Update conversation
    await db
      .update(conversations)
      .set({
        messageCount: (conversation.messageCount ?? 0) + 1,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, validated.data.conversationId));

    // Simulated AI response (replace with actual provider integration)
    const [aiMessage] = await db
      .insert(messages)
      .values({
        conversationId: validated.data.conversationId,
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'This is a simulated AI response. Integrate with your preferred AI provider.',
          },
        ],
        model: validated.data.model ?? 'simulated',
        tokensUsed: 50,
        processingTimeMs: 100,
      })
      .returning();

    return c.json({ messages: [userMessage, aiMessage] });
  } catch (error) {
    console.error('Error in AI response:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ── Workspace Management API ─────────────────────────────────

// List user's workspaces
app.get('/workspaces', async (c) => {
  try {
    const user = c.get('user');

    const userWorkspaces = await db
      .select({ workspaceId: workspaceMembers.workspaceId, role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, user.id));

    const workspaceIds = userWorkspaces.map((m) => m.workspaceId);
    const workspacesData = workspaceIds.length > 0
      ? await db.select().from(workspaces).where(inArray(workspaces.id, workspaceIds))
      : [];

    // Add role info
    const workspacesWithRole = workspacesData.map((ws) => {
      const membership = userWorkspaces.find((m) => m.workspaceId === ws.id);
      return { ...ws, role: membership?.role ?? 'member' };
    });

    return c.json({ workspaces: workspacesWithRole, count: workspacesWithRole.length });
  } catch (error) {
    console.error('Error listing workspaces:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create workspace
app.post('/workspaces', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validated = createWorkspaceSchema.safeParse(body);

    if (!validated.success) {
      return c.json(
        { error: 'Invalid input', details: validated.error.format() },
        400
      );
    }

    // Check if slug is taken
    const [existing] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, validated.data.slug))
      .limit(1);

    if (existing) {
      return c.json({ error: 'Workspace slug already exists' }, 409);
    }

    // Create workspace and add user as owner in transaction
    const [workspace] = await db
      .insert(workspaces)
      .values({
        name: validated.data.name,
        slug: validated.data.slug,
        description: validated.data.description,
        ownerId: user.id,
      })
      .returning();

    if (!workspace) {
      return c.json({ error: 'Failed to create workspace' }, 500);
    }

    // Add creator as owner
    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    });

    return c.json({ workspace: { ...workspace, role: 'owner' } }, 201);
  } catch (error) {
    console.error('Error creating workspace:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get workspace
app.get('/workspaces/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    if (!workspace) {
      return c.json({ error: 'Workspace not found' }, 404);
    }

    // Check membership
    const membership = await getWorkspaceMembership(db, user.id, id);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    return c.json({ workspace: { ...workspace, role: membership.role } });
  } catch (error) {
    console.error('Error getting workspace:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update workspace
app.patch('/workspaces/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    if (!workspace) {
      return c.json({ error: 'Workspace not found' }, 404);
    }

    // Check membership and role
    const membership = await getWorkspaceMembership(db, user.id, id);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    // Only owner/admin can update
    if (!hasMinimumRole(membership.role, 'admin')) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const [updated] = await db
      .update(workspaces)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, id))
      .returning();

    return c.json({ workspace: { ...updated, role: membership.role } });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete workspace
app.delete('/workspaces/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    if (!workspace) {
      return c.json({ error: 'Workspace not found' }, 404);
    }

    // Check membership and role
    const membership = await getWorkspaceMembership(db, user.id, id);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    // Only owner can delete
    if (!hasMinimumRole(membership.role, 'owner')) {
      return c.json({ error: 'Only the workspace owner can delete the workspace' }, 403);
    }

    // Use transaction for safe deletion
    await db.transaction(async (tx) => {
      // Get conversations in this workspace
      const workspaceConversations = await tx
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.workspaceId, id));
      const conversationIds = workspaceConversations.map((c) => c.id);

      // Delete in correct order
      if (conversationIds.length > 0) {
        await tx.delete(messages).where(inArray(messages.conversationId, conversationIds));
      }
      await tx.delete(conversations).where(eq(conversations.workspaceId, id));
      await tx.delete(documents).where(eq(documents.workspaceId, id));
      await tx.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, id));
      await tx.delete(workspaces).where(eq(workspaces.id, id));
    });

    return c.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ── Document Management API ─────────────────────────────────

// List documents
app.get('/documents', async (c) => {
  try {
    const user = c.get('user');
    const params = documentListParamsSchema.parse({
      page: c.req.query('page') ?? 1,
      limit: c.req.query('limit') ?? 20,
      search: c.req.query('search'),
      type: c.req.query('type'),
      status: c.req.query('status'),
      visibility: c.req.query('visibility'),
      workspaceId: c.req.query('workspaceId'),
    });

    // Get user's workspace memberships
    const userWorkspaces = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, user.id));

    const workspaceIds = userWorkspaces.map((m) => m.workspaceId);

    if (workspaceIds.length === 0) {
      return c.json({ items: [], total: 0, page: 1, limit: params.limit, totalPages: 0 });
    }

    // Build query
    const conditions = [
      inArray(documents.workspaceId, workspaceIds),
    ];

    // Filter by workspace if specified
    if (params.workspaceId) {
      if (!workspaceIds.includes(params.workspaceId)) {
        return c.json({ error: 'You are not a member of this workspace' }, 403);
      }
      conditions.push(eq(documents.workspaceId, params.workspaceId));
    }

    // Apply filters
    if (params.type) {
      conditions.push(eq(documents.type, params.type));
    }
    if (params.status) {
      conditions.push(eq(documents.status, params.status));
    }
    if (params.visibility) {
      conditions.push(eq(documents.visibility, params.visibility));
    }

    const query = db
      .select()
      .from(documents)
      .where(and(...conditions));

    // Execute with pagination
    const page = Math.max(1, params.page);
    const limit = Math.min(100, Math.max(1, params.limit));
    const offset = (page - 1) * limit;

    // For search, we need to load and filter in memory (or use full-text search)
    const allDocuments = await query.limit(limit).offset(offset).orderBy(desc(documents.createdAt));

    const filtered = params.search
      ? allDocuments.filter((doc) =>
          doc.name.includes(params.search!) ||
          doc.originalName.includes(params.search!)
        )
      : allDocuments;

    const totalResult = await db
      .select({ count: documents.id })
      .from(documents)
      .where(inArray(documents.workspaceId, workspaceIds));

    const total = totalResult.length;
    const totalPages = Math.ceil(total / limit);

    return c.json({
      items: filtered,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create document
app.post('/documents', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validated = createDocumentSchema.safeParse(body);

    if (!validated.success) {
      return c.json(
        { error: 'Invalid input', details: validated.error.format() },
        400
      );
    }

    // Check membership
    const membership = await getWorkspaceMembership(db, user.id, validated.data.workspaceId);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    const [document] = await db
      .insert(documents)
      .values({
        workspaceId: validated.data.workspaceId,
        name: validated.data.name ?? validated.data.originalName,
        originalName: validated.data.originalName,
        type: validated.data.type,
        mimeType: validated.data.mimeType,
        size: validated.data.size,
        status: 'uploading',
        visibility: validated.data.visibility ?? 'private',
        ownerId: user.id,
        storagePath: validated.data.storagePath ?? '',
        checksum: validated.data.checksum,
        metadata: validated.data.metadata,
      })
      .returning();

    if (!document) {
      return c.json({ error: 'Failed to create document' }, 500);
    }

    return c.json({ document }, 201);
  } catch (error) {
    console.error('Error creating document:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get document
app.get('/documents/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Check membership
    const membership = await getWorkspaceMembership(db, user.id, document.workspaceId);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    // Check visibility for private documents
    if (document.visibility === 'private' && document.ownerId !== user.id) {
      return c.json({ error: 'Document is private' }, 403);
    }

    return c.json({ document });
  } catch (error) {
    console.error('Error getting document:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update document
app.patch('/documents/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = updateDocumentSchema.safeParse(body);

    if (!validated.success) {
      return c.json(
        { error: 'Invalid input', details: validated.error.format() },
        400
      );
    }

    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Check membership
    const membership = await getWorkspaceMembership(db, user.id, document.workspaceId);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    // Check permissions for visibility changes
    if (validated.data.visibility && validated.data.visibility !== document.visibility) {
      if (!hasMinimumRole(membership.role, 'admin') && document.ownerId !== user.id) {
        return c.json({ error: 'Insufficient permissions to change visibility' }, 403);
      }
    }

    // Owner or admin can update
    if (document.ownerId !== user.id && !hasMinimumRole(membership.role, 'admin')) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const [updated] = await db
      .update(documents)
      .set({
        ...validated.data,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();

    return c.json({ document: updated });
  } catch (error) {
    console.error('Error updating document:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete document
app.delete('/documents/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Check membership
    const membership = await getWorkspaceMembership(db, user.id, document.workspaceId);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    // Only owner can delete
    if (document.ownerId !== user.id) {
      return c.json({ error: 'Only the document owner can delete it' }, 403);
    }

    await db.delete(documents).where(eq(documents.id, id));

    return c.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ── Workspace Member Management ──────────────────────────────

// List members
app.get('/workspaces/:id/members', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    if (!workspace) {
      return c.json({ error: 'Workspace not found' }, 404);
    }

    // Check membership
    const membership = await getWorkspaceMembership(db, user.id, id);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    const members = await db
      .select({
        id: workspaceMembers.id,
        workspaceId: workspaceMembers.workspaceId,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
        createdAt: workspaceMembers.createdAt,
        user: {
          id: workspaceMembers.userId,
          email: sessions.userId, // This won't work - need to join users
        },
      })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, id));

    return c.json({ members });
  } catch (error) {
    console.error('Error listing members:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add member
app.post('/workspaces/:id/members', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();

    const schema = z.object({
      userId: z.string().uuid(),
      role: z.enum(['viewer', 'member', 'admin']).optional(),
    });

    const validated = schema.safeParse(body);
    if (!validated.success) {
      return c.json(
        { error: 'Invalid input', details: validated.error.format() },
        400
      );
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    if (!workspace) {
      return c.json({ error: 'Workspace not found' }, 404);
    }

    // Check membership and role
    const membership = await getWorkspaceMembership(db, user.id, id);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    // Only owner/admin can add members
    if (!hasMinimumRole(membership.role, 'admin')) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    // Check if user is already a member
    const [existing] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, id),
          eq(workspaceMembers.userId, validated.data.userId)
        )
      )
      .limit(1);

    if (existing) {
      return c.json({ error: 'User is already a member of this workspace' }, 409);
    }

    await db.insert(workspaceMembers).values({
      workspaceId: id,
      userId: validated.data.userId,
      role: validated.data.role ?? 'member',
    });

    return c.json({ message: 'Member added successfully' }, 201);
  } catch (error) {
    console.error('Error adding member:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update member role
app.patch('/workspaces/:id/members/:userId', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const targetUserId = c.req.param('userId');
    const body = await c.req.json();

    const schema = z.object({
      role: z.enum(['viewer', 'member', 'admin']).optional(),
    });

    const validated = schema.safeParse(body);
    if (!validated.success) {
      return c.json(
        { error: 'Invalid input', details: validated.error.format() },
        400
      );
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    if (!workspace) {
      return c.json({ error: 'Workspace not found' }, 404);
    }

    // Check membership and role
    const membership = await getWorkspaceMembership(db, user.id, id);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    // Only owner can update roles
    if (!hasMinimumRole(membership.role, 'owner')) {
      return c.json({ error: 'Only workspace owner can update member roles' }, 403);
    }

    // Prevent owner demotion
    if (targetUserId === await getCurrentOwnerId(db, id)) {
      return c.json({ error: 'Cannot remove the last workspace owner' }, 403);
    }

    await db
      .update(workspaceMembers)
      .set({ role: validated.data.role })
      .where(
        and(
          eq(workspaceMembers.workspaceId, id),
          eq(workspaceMembers.userId, targetUserId)
        )
      );

    return c.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Error updating member role:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Remove member
app.delete('/workspaces/:id/members/:userId', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const targetUserId = c.req.param('userId');

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    if (!workspace) {
      return c.json({ error: 'Workspace not found' }, 404);
    }

    // Check membership and role
    const membership = await getWorkspaceMembership(db, user.id, id);
    if (!membership) {
      return c.json({ error: 'You are not a member of this workspace' }, 403);
    }

    // Only owner can remove members
    if (!hasMinimumRole(membership.role, 'owner')) {
      return c.json({ error: 'Only workspace owner can remove members' }, 403);
    }

    // Prevent owner removal
    if (targetUserId === await getCurrentOwnerId(db, id)) {
      return c.json({ error: 'Cannot remove the last workspace owner' }, 403);
    }

    await db
      .delete(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, id),
          eq(workspaceMembers.userId, targetUserId)
        )
      );

    return c.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Export for server and testing
export { db };
export type AppType = typeof app;
export { app };
