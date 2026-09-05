// Document-related types

import { z } from 'zod';
import { baseEntitySchema, paginationParamsSchema, paginatedResponseSchema, sortParamsSchema, uuidSchema } from './common';

// Document status
export const documentStatusSchema = z.enum([
  'uploading',
  'processing',
  'ready',
  'error',
  'archived',
]);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

// Document type/category
export const documentTypeSchema = z.enum([
  'pdf',
  'txt',
  'md',
  'docx',
  'pptx',
  'xlsx',
  'csv',
  'json',
  'image',
  'audio',
  'video',
  'other',
]);
export type DocumentType = z.infer<typeof documentTypeSchema>;

// Document visibility
export const documentVisibilitySchema = z.enum(['private', 'workspace', 'public']);
export type DocumentVisibility = z.infer<typeof documentVisibilitySchema>;

// Document
export const documentSchema = baseEntitySchema.extend({
  workspaceId: uuidSchema,
  name: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  type: documentTypeSchema,
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  status: documentStatusSchema,
  visibility: documentVisibilitySchema,
  ownerId: uuidSchema,
  storagePath: z.string(),
  checksum: z.string().optional(),
  metadata: documentMetadataSchema.optional(),
  processingError: z.string().optional(),
  processedAt: z.date().optional(),
});

export type Document = z.infer<typeof documentSchema>;

// Document metadata (extracted during processing)
export const documentMetadataSchema = z.object({
  pageCount: z.number().int().positive().optional(),
  wordCount: z.number().int().nonnegative().optional(),
  characterCount: z.number().int().nonnegative().optional(),
  language: z.string().optional(),
  author: z.string().optional(),
  title: z.string().optional(),
  subject: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  custom: z.record(z.unknown()).optional(),
});

export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;

// Document chunk (for RAG)
export const documentChunkSchema = baseEntitySchema.extend({
  documentId: uuidSchema,
  workspaceId: uuidSchema,
  content: z.string(),
  tokenCount: z.number().int().positive(),
  sequence: z.number().int().nonnegative(),
  metadata: chunkMetadataSchema.optional(),
  embedding: z.array(z.number()).optional(), // Stored separately in vector DB
});

export type DocumentChunk = z.infer<typeof documentChunkSchema>;

export const chunkMetadataSchema = z.object({
  pageNumber: z.number().int().positive().optional(),
  sectionTitle: z.string().optional(),
  chunkType: z.enum(['text', 'table', 'image', 'code', 'header', 'footer']).optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(), // x, y, width, height
});

export type ChunkMetadata = z.infer<typeof chunkMetadataSchema>;

// API request/response types
export const uploadDocumentSchema = z.object({
  workspaceId: uuidSchema,
  name: z.string().min(1).max(255).optional(),
  visibility: documentVisibilitySchema.default('private'),
  metadata: documentMetadataSchema.partial().optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const updateDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  visibility: documentVisibilitySchema.optional(),
  metadata: documentMetadataSchema.partial().optional(),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

export const documentListParamsSchema = paginationParamsSchema.merge(sortParamsSchema).extend({
  search: z.string().optional(),
  type: documentTypeSchema.optional(),
  status: documentStatusSchema.optional(),
  visibility: documentVisibilitySchema.optional(),
});

export type DocumentListParams = z.infer<typeof documentListParamsSchema>;

export const documentListResponseSchema = paginatedResponseSchema(documentSchema);
export type DocumentListResponse = z.infer<typeof documentListResponseSchema>;

// Presigned URL for direct upload
export const presignedUploadUrlSchema = z.object({
  uploadUrl: z.string().url(),
  storagePath: z.string(),
  expiresAt: z.string().datetime(),
  headers: z.record(z.string()).optional(),
});

export type PresignedUploadUrl = z.infer<typeof presignedUploadUrlSchema>;

export const createPresignedUrlSchema = z.object({
  workspaceId: uuidSchema,
  fileName: z.string().min(1).max(255),
  contentType: z.string(),
  contentLength: z.number().int().positive(),
});

export type CreatePresignedUrlInput = z.infer<typeof createPresignedUrlSchema>;

// Document processing job
export const processingJobSchema = baseEntitySchema.extend({
  documentId: uuidSchema,
  workspaceId: uuidSchema,
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  stage: z.enum(['extract', 'chunk', 'embed', 'index']).optional(),
  progress: z.number().int().min(0).max(100).default(0),
  error: z.string().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export type ProcessingJob = z.infer<typeof processingJobSchema>;