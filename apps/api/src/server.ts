/**
 * HTTP Server entrypoint for Hono API using @hono/node-server
 *
 * This file starts the actual HTTP server. The Hono app is created in index.ts
 * and exported for testing and potential serverless deployments.
 */

import { serve } from '@hono/node-server';

import { app } from './index';

const port = parseInt(process.env.PORT ?? '3002', 10);

console.log(`🚀 Starting API server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ API server running on http://localhost:${info.port}`);
  console.log(`   Health: http://localhost:${info.port}/health`);
  console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
});
