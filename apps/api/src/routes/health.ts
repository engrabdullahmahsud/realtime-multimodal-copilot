import { Hono } from 'hono';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm';
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

// Create database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const pg = postgres({
  connectionString,
  prepareSql: true,
});

const db = drizzle({
  provider: postgres,
  connection: pg,
  schema: [],
});

// Create Hono app
const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Test endpoint
const testSchema = z.object({
  message: z.string().default('Hello from Copilot API!'),
  timestamp: z.date(),
});

app.get('/test', async (c) => {
  try {
    return c.json({
      message: 'API is working',
      timestamp: new Date().toISOString(),
      testData: { status: 'connected' },
    });
  } catch (error) {
    console.error('Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/test', async (c) => {
  try {
    const body = await c.json();
    const parsed = testSchema.parse(body);

    return c.json({
      message: `Received: ${parsed.message}`,
      timestamp: new Date().toISOString(),
      echo: body,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request payload' }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Basic API routes will be added here
 * This is a stub for now - actual endpoints will be implemented later
 */

export default app;