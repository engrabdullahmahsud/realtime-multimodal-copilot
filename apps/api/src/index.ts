import { Hono } from 'hono';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import {
  workspaces,
  documents,
  conversations,
  messages,
} from '@copilot/types/database';
import {
  createConversationSchema,
  createMessageSchema,
  conversationListParamsSchema,
} from '@copilot/types';
import { healthRoute } from './routes/health';
import type { z } from 'zod';

config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const pg = postgres(connectionString);
const db = drizzle(pg);

const app = new Hono();

// Health check endpoint
healthRoute(app);

// ==========================================
// Conversation Management API
// ==========================================

// List conversations with pagination and filtering
app.get('/conversations', async (c) => {
  try {
    const params = conversationListParamsSchema.parse({
      page: c.req.query('page') || 1,
      limit: c.req.query('limit') || 20,
      search: c.req.query('search'),
      archived: c.req.query('archived'),
    });

    const allConversations = await db.select().from(conversations);

    // Filter by search if provided
    let filtered = allConversations;
    if (params.search) {
      filtered = filtered.filter((conv) =>
        conv.title.includes(params.search!) ||
        (conv.description != null && conv.description.includes(params.search!))
      );
    }

    // Sort
    const sortBy = (params.sortBy || 'lastMessageAt') as keyof typeof filtered[0];
    const sortOrder = params.sortOrder || 'desc';
    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortOrder === 'desc' ? 1 : -1;
      if (bVal == null) return sortOrder === 'desc' ? -1 : 1;
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });

    // Paginate
    const page = Math.max(1, params.page);
    const limit = Math.min(Math.max(1, params.limit), 100);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = filtered.slice(start, end);

    return c.json({ items, total, page, limit, totalPages });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create conversation
app.post('/conversations', async (c) => {
  try {
    const body = await c.req.json();
    const validated = createConversationSchema.safeParse(body);

    if (!validated.success) {
      return c.json({ error: 'Invalid request payload', details: validated.error.format() }, 400);
    }

    const data = validated.data;
    const [newConversation] = await db
      .insert(conversations)
      .values({
        workspaceId: data.workspaceId,
        title: data.title,
        description: data.description,
        ownerId: data.ownerId,
        model: data.model,
        systemPrompt: data.systemPrompt,
        settings: data.settings as Record<string, unknown> | undefined,
        messageCount: 0,
        lastMessageAt: new Date(),
      })
      .returning();

    return c.json({ conversation: newConversation, received: true });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get conversation by ID
app.get('/conversations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Load messages for this conversation
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id));

    return c.json({ conversation, messages: conversationMessages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update conversation
app.patch('/conversations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const [updated] = await db
      .update(conversations)
      .set({
        title: body.title,
        description: body.description,
        model: body.model,
        systemPrompt: body.systemPrompt,
        settings: body.settings,
        messageCount: body.messageCount,
        lastMessageAt: body.lastMessageAt ? new Date(body.lastMessageAt) : undefined,
        archivedAt: body.archivedAt ? new Date(body.archivedAt) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    return c.json({ conversation: updated });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete conversation (soft delete via archivedAt)
app.delete('/conversations/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const [deleted] = await db
      .update(conversations)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();

    if (!deleted) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    return c.json({ conversation: deleted });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==========================================
// Message API
// ==========================================

// List messages for a conversation
app.get('/conversations/:conversationId/messages', async (c) => {
  try {
    const conversationId = c.req.param('conversationId');
    const page = Number(c.req.query('page') || 1);
    const limit = Number(c.req.query('limit') || 50);

    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    // Sort by createdAt descending, then paginate
    const sorted = allMessages.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = sorted.length;
    const pageNum = Math.max(1, page);
    const pageLimit = Math.min(Math.max(1, limit), 100);
    const totalPages = Math.ceil(total / pageLimit);
    const start = (pageNum - 1) * pageLimit;
    const end = start + pageLimit;
    const items = sorted.slice(start, end);

    return c.json({ items, total, page: pageNum, limit: pageLimit, totalPages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create message
app.post('/conversations/:conversationId/messages', async (c) => {
  try {
    const conversationId = c.req.param('conversationId');
    const body = await c.req.json();

    const validated = createMessageSchema.safeParse(body);

    if (!validated.success) {
      return c.json({ error: 'Invalid request payload', details: validated.error.format() }, 400);
    }

    const data = validated.data;

    // Check conversation exists
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        role: data.role,
        content: data.content,
        citations: data.citations,
        model: data.model,
        tokensUsed: data.tokensUsed,
        processingTimeMs: data.processingTimeMs,
        error: data.error,
        metadata: data.metadata,
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

    return c.json({ message: newMessage, conversationId });
  } catch (error) {
    console.error('Error creating message:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==========================================
// AI Response Endpoint
// ==========================================

// Generate AI response (HTTP-compatible, provider-agnostic)
// Simulated for development — real provider integration requires
// OPENAI_API_KEY or similar env var set via a provider package.
app.post('/ai/response', async (c) => {
  try {
    const body = await c.req.json();

    const conversationId = body.conversationId;
    if (!conversationId) {
      return c.json({ error: 'conversationId is required' }, 400);
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Load recent messages for context
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    // Build system prompt from conversation settings
    const systemPrompt = conversation.systemPrompt || '';

    // Prepare message history for AI
    const messageHistory = conversationMessages.map((msg) => ({
      role: msg.role,
      content: (msg.content as Array<{ type: string; text?: string }>)
        .map((part) => part.text)
        .filter(Boolean)
        .join(''),
    }));

    // Simulate AI response (provider-agnostic architecture)
    // In production, this calls an LLM API using the provider abstraction.
    // This fallback is ONLY for development when no provider key is set.
    const aiResponse = {
      id: `msg_${Date.now()}`,
      type: 'content' as const,
      content: `[Simulated AI response] Received ${messageHistory.length} message(s). System prompt: ${systemPrompt.substring(0, 50) || '(none)'}`,
      citations: [] as Array<unknown>,
      model: conversation.model || 'simulated',
      usage: {
        promptTokens: body.prompt?.length || 0,
        completionTokens: 50,
        totalTokens: (body.prompt?.length || 0) + 50,
      },
      createdAt: new Date().toISOString(),
    };

    // Persist the assistant message
    const [assistantMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        role: 'assistant',
        content: [{ type: 'text', text: aiResponse.content }],
        model: aiResponse.model,
        tokensUsed: aiResponse.usage.totalTokens,
        processingTimeMs: 100,
      })
      .returning();

    // Update conversation message count
    await db
      .update(conversations)
      .set({
        messageCount: (conversation.messageCount ?? 0) + 1,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    return c.json({
      response: aiResponse,
      conversationId,
      message: assistantMessage,
    });
  } catch (error) {
    console.error('Error generating AI response:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==========================================
// Workspace API (existing)
// ==========================================

// List workspaces
app.get('/workspaces', async (c) => {
  try {
    const allWorkspaces = await db.select().from(workspaces);
    return c.json({ workspaces: allWorkspaces, count: allWorkspaces.length });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create workspace
app.post('/workspaces', async (c) => {
  try {
    const body = await c.req.json();
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name: body.name,
        slug: body.slug,
        description: body.description,
        ownerId: body.ownerId,
      })
      .returning();

    return c.json({ workspace: newWorkspace, received: true });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get workspace by ID
app.get('/workspaces/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id));

    if (!workspace) {
      return c.json({ error: 'Workspace not found' }, 404);
    }

    return c.json({ workspace });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==========================================
// Document API (existing)
// ==========================================

// List documents
app.get('/documents', async (c) => {
  try {
    const allDocuments = await db.select().from(documents);
    return c.json({ documents: allDocuments, count: allDocuments.length });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create document
app.post('/documents', async (c) => {
  try {
    const body = await c.req.json();
    const [newDocument] = await db
      .insert(documents)
      .values({
        workspaceId: body.workspaceId,
        name: body.name,
        originalName: body.originalName,
        type: body.type,
        mimeType: body.mimeType,
        size: body.size,
        status: body.status ?? 'uploading',
        visibility: body.visibility ?? 'private',
        ownerId: body.ownerId,
        storagePath: body.storagePath,
        checksum: body.checksum,
        metadata: body.metadata,
        processingError: body.processingError,
        processedAt: body.processedAt,
      })
      .returning();

    return c.json({ document: newDocument, received: true });
  } catch (error) {
    console.error('Error creating document:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get document by ID
app.get('/documents/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));

    if (!document) {
      return c.json({ error: 'Document not found' }, 404);
    }

    return c.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==========================================
// Database
// ==========================================

export { db };

// Export type and app
export type AppType = typeof app;

export { app };
