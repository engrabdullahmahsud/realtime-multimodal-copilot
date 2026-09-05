import { Hono } from 'hono';
import { config } from 'dotenv';
import { healthRoute } from './routes/health';

// Load environment variables
config();

// Create API server
const app = new Hono();

// Health check endpoint
app.get('/health', healthRoute);

// Test endpoint
app.get('/test', async (c) => {
  return c.json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
  });
});

// Basic API routes will be added here
// This is a stub for now - actual endpoints will be implemented later

export default app;