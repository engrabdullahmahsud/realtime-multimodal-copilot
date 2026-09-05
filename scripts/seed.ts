/**
 * Database seed script for development environment.
 *
 * SAFETY: Refuses to run in production unless explicitly overridden
 * with --confirm-production flag.
 *
 * Usage:
 *   pnpm db:seed                    # standard dev seed
 *   NODE_ENV=production pnpm db:seed --confirm-production  # force in prod
 */

import { drizzle } from 'drizzle-orm/postgres.js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { config } from 'dotenv';
import {
  users,
  workspaces,
  workspaceMembers,
  conversations,
  messages,
  documents,
} from '../packages/types/src/database';

config();

// ─── Safety gate ──────────────────────────────────────────────

const nodeEnv = process.env.NODE_ENV || 'development';
const confirmFlag = process.argv.includes('--confirm-production');

if (nodeEnv === 'production' && !confirmFlag) {
  console.error(
    '\n❌ Refusing to seed in production. ' +
      'Use --confirm-production flag if this is intentional.\n'
  );
  process.exit(1);
}

// ─── Database connection ───────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in environment variables.');
  process.exit(1);
}

const pg = postgres(connectionString);
const db = drizzle(pg);

// ─── Seed data ─────────────────────────────────────────────────

async function seed() {
  console.log(`\n🌱 Seeding database (${nodeEnv} mode)...\n`);

  // 1. Create a default user (skip if already exists)
  const existingUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'dev@copilot.local'))
    .limit(1);

  let userId: string;

  if (existingUsers.length > 0) {
    userId = existingUsers[0].id;
    console.log(`  ✓ User already exists: ${userId}`);
  } else {
    const [created] = await db
      .insert(users)
      .values({
        email: 'dev@copilot.local',
        name: 'Development User',
        passwordHash: 'dev-only-hash-not-real',
        environment: 'development',
      })
      .returning();

    if (!created) {
      console.error('❌ Failed to create default user.');
      process.exit(1);
    }
    userId = created.id;
    console.log(`  ✓ User created: ${userId}`);
  }

  // 2. Create a default workspace (skip if already exists)
  const existingWorkspaces = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.slug, 'dev-workspace'))
    .limit(1);

  let workspaceId: string;

  if (existingWorkspaces.length > 0) {
    workspaceId = existingWorkspaces[0].id;
    console.log(`  ✓ Workspace already exists: ${workspaceId}`);
  } else {
    const [created] = await db
      .insert(workspaces)
      .values({
        name: 'Development Workspace',
        slug: 'dev-workspace',
        description: 'Auto-created workspace for local development',
        ownerId: userId,
      })
      .returning();

    if (!created) {
      console.error('❌ Failed to create default workspace.');
      process.exit(1);
    }
    workspaceId = created.id;
    console.log(`  ✓ Workspace created: ${workspaceId}`);
  }

  // 3. Add user as workspace member (owner) — safe to re-run
  const existingMember = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .limit(1);

  if (existingMember.length === 0) {
    await db.insert(workspaceMembers).values({
      workspaceId,
      userId,
      role: 'owner',
    });
    console.log('  ✓ Workspace membership created');
  } else {
    console.log('  ✓ Workspace membership already exists');
  }

  // 4. Create a sample conversation (skip if workspace already has conversations)
  const existingConversations = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.workspaceId, workspaceId))
    .limit(1);

  if (existingConversations.length === 0) {
    const [sampleConversation] = await db
      .insert(conversations)
      .values({
        workspaceId,
        title: 'Getting Started',
        description: 'A sample conversation for development',
        ownerId: userId,
        model: 'simulated',
        systemPrompt: 'You are a helpful AI copilot for document analysis.',
        messageCount: 2,
        lastMessageAt: new Date(),
      })
      .returning();

    if (sampleConversation) {
      await db.insert(messages).values([
        {
          conversationId: sampleConversation.id,
          role: 'user',
          content: [{ type: 'text', text: 'Hello! Can you help me analyze my documents?' }],
        },
        {
          conversationId: sampleConversation.id,
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: "Of course! I'm your AI copilot. Upload documents to this workspace and I'll help you analyze them, answer questions, and provide citations.",
            },
          ],
          model: 'simulated',
          tokensUsed: 42,
          processingTimeMs: 80,
        },
      ]);
      console.log('  ✓ Sample conversation with messages');
    }
  } else {
    console.log('  ✓ Conversations already exist, skipping');
  }

  // 5. Create a sample document (skip if workspace already has documents)
  const existingDocs = await db
    .select({ id: documents.id })
    .from(documents)
    .where(eq(documents.workspaceId, workspaceId))
    .limit(1);

  if (existingDocs.length === 0) {
    await db
      .insert(documents)
      .values({
        workspaceId,
        name: 'sample-document.pdf',
        originalName: 'sample-document.pdf',
        type: 'pdf',
        mimeType: 'application/pdf',
        size: 102400,
        status: 'ready',
        visibility: 'workspace',
        ownerId: userId,
        storagePath: '/dev/sample-document.pdf',
      });
    console.log('  ✓ Sample document');
  } else {
    console.log('  ✓ Documents already exist, skipping');
  }

  console.log('\n✅ Seed complete.\n');
}

// ─── Execute ───────────────────────────────────────────────────

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    pg.end();
  });
