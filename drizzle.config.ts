import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle', // output folder for migrations
  schema: './packages/types/src/database.ts', // path to your schema
  dialect: 'postgresql', // dialect
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  // optional: includes relations
  strict: true,
  verbose: true,
};
