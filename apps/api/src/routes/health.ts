import type { Hono } from 'hono';

export const healthRoute = (app: Hono) => {
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.0.0',
      environment: process.env.NODE_ENV ?? 'development',
    });
  });

  // Ping endpoint
  app.get('/ping', (c) => {
    return c.json({ pong: true });
  });
};