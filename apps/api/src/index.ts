import { Hono } from 'hono';
import { config } from 'dotenv';
import { drizzle, postgres, eq } from 'drizzle-orm';
import { workspaces, documents, conversations, messages } from '../packages/types/src/database';
import { createConversationSchema, createMessageSchema, conversationListParamsSchema, conversationListResponseSchema } from '../packages/types/src';
import { z } from 'zod';

config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const pg = postgres({
  connectionString,
  prepareSql: true,
});

const database = drizzle({ provider: postgres, connection: pg });

const app = new Hono();

// Health check endpoint
app.route('/health', healthRoute());

// ==========================================
// Conversation Management API
// ==========================================

// List conversations with pagination and filtering
app.get('/conversations', async (c) => {
  try {
    const params = conversationListParamsSchema.parse({
      page: c.requery('page') || 1,
      limit: c.requery('limit') || 20,
      search: c.requery('search'),
      archived: c.requery('archived'),
    });
    
    const allConversations = await database.select().from(conversations);
    
    // Filter by search if provided
    let filtered = allConversations;
    if (params.search) {
      filtered = filtered.filter(c => 
        c.title.includes(params.search) || 
        (c.description && c.description.includes(params.search))
      );
    }
    
    // Sort
    const sortBy = params.sortBy || 'lastMessageAt';
    const sortOrder = params.sortOrder || 'desc';
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];
      if (sortOrder === 'desc') {
        return (bVal as any) - (aVal as any);
      } else {
        return (aVal as any) - (bVal as any);
      }
    });
    
    // Paginate
    const page = Math.max(1, params.page);
    const limit = Math.min(Math.max(1, params.limit), 100);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = filtered.slice(start, end);
    
    return c.json({
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create conversation
app.post('/conversations', async (c) => {
  try {
    const body = await c.json();
    const validated = createConversationSchema.safeParse(body);
    
    if (!validated.success) {
      return c.json({ error: 'Invalid request payload', details: validated.error.format() }, 400);
    }
    
    const data = validated.data;
    const [newConversation] = await database
      .insert(conversations)
      .values({
        workspaceId: data.workspaceId,
        title: data.title,
        description: data.description,
        ownerId: data.ownerId,
        model: data.model,
        systemPrompt: data.systemPrompt,
        settings: data.settings,
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
    const id = c.reparam('id') as string;
    const [conversation] = await database
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Load messages for this conversation
    const messages = await database.select().from(messages).where(eq(messages.conversationId, id));
    
    return c.json({ conversation, messages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update conversation
app.patch('/conversations/:id', async (c) => {
  try {
    const id = c.reparam('id') as string;
    const body = await c.json();
    
    const [updated] = await database
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
    const id = c.reparam('id') as string;
    
    const [deleted] = await database
      .update(conversations)
      .set({ archivedAt: new Date() })
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
    const conversationId = c.reparam('conversationId') as string;
    const page = c.requery('page') || 1;
    const limit = c.requery('limit') || 50;
    
    const allMessages = await database.select().from(messages).where(eq(messages.conversationId, conversationId));
    
    // Sort by createdAt descending, then paginate
    const sorted = allMessages.sort((a, b) => 
      (b.createdAt as any) - (a.createdAt as any)
    );
    
    const total = sorted.length;
    const pageNum = Math.max(1, page);
    const pageLimit = Math.min(Math.max(1, limit), 100);
    const totalPages = Math.ceil(total / pageLimit);
    const start = (pageNum - 1) * pageLimit;
    const end = start + pageLimit;
    const items = sorted.slice(start, end);
    
    return c.json({
      items,
      total,
      page: pageNum,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create message
app.post('/conversations/:conversationId/messages', async (c) => {
  try {
    const conversationId = c.reparam('conversationId') as string;
    const body = await c.json();
    
    const validated = createMessageSchema.safeParse(body);
    
    if (!validated.success) {
      return c.json({ error: 'Invalid request payload', details: validated.error.format() }, 400);
    }
    
    const data = validated.data;
    
    // Check conversation exists
    const [conversation] = await database
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }
    
    const [newMessage] = await database
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
    await database
      .update(conversations)
      .set({
        messageCount: conversation.messageCount + 1,
        lastMessageAt: new Date(),
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
app.post('/ai/response', async (c) => {
  try {
    const body = await c.json();
    
    // Get conversation context
    const conversationId = body.conversationId;
    if (!conversationId) {
      return c.json({ error: 'conversationId is required' }, 400);
    }
    
    const [conversation] = await database
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }
    
    // Load recent messages for context
    const messages = await database.select().from(messages).where(eq(messages.conversationId, conversationId));
    
    // Build system prompt from conversation settings
    const systemPrompt = conversation.systemPrompt || '';
    const temperature = conversation.settings?.temperature ?? 0.7;
    const maxTokens = conversation.settings?.maxTokens ?? 4096;
    
    // Prepare message history for AI
    const messageHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content.map((c: any) => c.text).filter(Boolean),
    }));
    
    // Simulate AI response (provider-agnostic architecture)
    // In production, this would call an LLM API with the message history
    const aiResponse = {
      id: `msg_${Date.now()}`,
      type: 'content',
      content: `Response to: "${body.prompt?.substring(0, 50) || 'query'}"`,
      citations: [],
      model: conversation.model || 'default',
      usage: {
        promptTokens: body.prompt?.length || 0,
        completionTokens: 50,
        totalTokens: (body.prompt?.length || 0) + 50,
      },
      createdAt: new Date().toISOString(),
    };
    
    // Persist the assistant message
    const [assistantMessage] = await database
      .insert(messages)
      .values({
        conversationId,
        role: 'assistant',
        content: [{ type: 'text', text: aiResponse.content }],
        model: aiResponse.model,
        tokensUsed: aiResponse.usage?.totalTokens || 0,
        processingTimeMs: 100,
      })
      .returning();
    
    // Update conversation message count
    await database
      .update(conversations)
      .set({
        messageCount: conversation.messageCount + 1,
        lastMessageAt: new Date(),
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

// Export type and app
export type AppType = typeof app;

export { app };
