// AI-related types

import { z } from 'zod';

import { baseEntitySchema, uuidSchema } from './common';

// Model providers
export const modelProviderSchema = z.enum([
  'openai',
  'anthropic',
  'google',
  'cohere',
  'mistral',
  'local',
  'custom',
]);
export type ModelProvider = z.infer<typeof modelProviderSchema>;

// Model capabilities
export const modelCapabilitySchema = z.enum([
  'chat',
  'embedding',
  'vision',
  'audio_transcription',
  'audio_generation',
  'function_calling',
  'streaming',
]);
export type ModelCapability = z.infer<typeof modelCapabilitySchema>;

// Model configuration
export const modelConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: modelProviderSchema,
  capabilities: z.array(modelCapabilitySchema),
  contextWindow: z.number().int().positive(),
  maxOutputTokens: z.number().int().positive().optional(),
  pricing: z.object({
    inputPer1k: z.number().nonnegative().optional(),
    outputPer1k: z.number().nonnegative().optional(),
  }).optional(),
  deprecated: z.boolean().default(false),
});

export type ModelConfig = z.infer<typeof modelConfigSchema>;

// Embedding model configuration
export const embeddingModelConfigSchema = modelConfigSchema.extend({
  capabilities: z.array(modelCapabilitySchema).refine(arr => arr.includes('embedding')),
  dimensions: z.number().int().positive(),
});

export type EmbeddingModelConfig = z.infer<typeof embeddingModelConfigSchema>;

// Chat model configuration
export const chatModelConfigSchema = modelConfigSchema.extend({
  capabilities: z.array(modelCapabilitySchema).refine(arr => arr.includes('chat')),
});

export type ChatModelConfig = z.infer<typeof chatModelConfigSchema>;

// AI Provider configuration
export const aiProviderConfigSchema = z.object({
  provider: modelProviderSchema,
  apiKey: z.string().optional(), // Stored in secrets manager, not in DB
  baseUrl: z.string().url().optional(),
  organizationId: z.string().optional(),
  models: z.array(modelConfigSchema),
  defaultChatModel: z.string().optional(),
  defaultEmbeddingModel: z.string().optional(),
  rateLimits: z.object({
    requestsPerMinute: z.number().int().positive().optional(),
    tokensPerMinute: z.number().int().positive().optional(),
  }).optional(),
});

export type AIProviderConfig = z.infer<typeof aiProviderConfigSchema>;

// RAG Configuration
export const ragConfigSchema = z.object({
  embeddingModel: z.string(),
  chunkSize: z.number().int().positive().default(1000),
  chunkOverlap: z.number().int().nonnegative().default(200),
  similarityThreshold: z.number().min(0).max(1).default(0.7),
  maxRetrievedChunks: z.number().int().positive().max(50).default(10),
  rerankEnabled: z.boolean().default(false),
  rerankModel: z.string().optional(),
  hybridSearchEnabled: z.boolean().default(false),
  bm25Weight: z.number().min(0).max(1).default(0.3),
});

export type RAGConfig = z.infer<typeof ragConfigSchema>;

// AI Request/Response types
export const chatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'tool']),
    content: z.union([z.string(), z.array(z.object({
      type: z.enum(['text', 'image_url']),
      text: z.string().optional(),
      image_url: z.object({ url: z.string().url() }).optional(),
    }))]),
    tool_calls: z.array(z.object({
      id: z.string(),
      type: z.literal('function'),
      function: z.object({
        name: z.string(),
        arguments: z.string(),
      }),
    })).optional(),
    tool_call_id: z.string().optional(),
  })),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stream: z.boolean().default(false),
  tools: z.array(z.object({
    type: z.literal('function'),
    function: z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.unknown()),
    }),
  })).optional(),
  toolChoice: z.union([z.literal('auto'), z.literal('none'), z.object({
    type: z.literal('function'),
    function: z.object({ name: z.string() }),
  })]).optional(),
  responseFormat: z.object({ type: z.enum(['text', 'json_object']) }).optional(),
  seed: z.number().int().optional(),
  user: z.string().optional(),
});

export type ChatCompletionRequest = z.infer<typeof chatCompletionRequestSchema>;

export const chatCompletionResponseSchema = z.object({
  id: z.string(),
  object: z.literal('chat.completion'),
  created: z.number().int(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number().int(),
    message: z.object({
      role: z.enum(['assistant']),
      content: z.string().nullable(),
      tool_calls: z.array(z.object({
        id: z.string(),
        type: z.literal('function'),
        function: z.object({
          name: z.string(),
          arguments: z.string(),
        }),
      })).optional(),
    }),
    finishReason: z.enum(['stop', 'length', 'tool_calls', 'content_filter']).nullable(),
  })),
  usage: z.object({
    promptTokens: z.number().int(),
    completionTokens: z.number().int(),
    totalTokens: z.number().int(),
  }).optional(),
  systemFingerprint: z.string().optional(),
});

export type ChatCompletionResponse = z.infer<typeof chatCompletionResponseSchema>;

// Streaming chunk
export const chatCompletionChunkSchema = z.object({
  id: z.string(),
  object: z.literal('chat.completion.chunk'),
  created: z.number().int(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number().int(),
    delta: z.object({
      role: z.enum(['assistant']).optional(),
      content: z.string().nullable().optional(),
      tool_calls: z.array(z.object({
        index: z.number().int(),
        id: z.string().optional(),
        type: z.literal('function'),
        function: z.object({
          name: z.string().optional(),
          arguments: z.string().optional(),
        }),
      })).optional(),
    }),
    finishReason: z.enum(['stop', 'length', 'tool_calls', 'content_filter']).nullable(),
  })),
});

export type ChatCompletionChunk = z.infer<typeof chatCompletionChunkSchema>;

// Embedding request/response
export const embeddingRequestSchema = z.object({
  model: z.string(),
  input: z.union([z.string(), z.array(z.string())]),
  encodingFormat: z.enum(['float', 'base64']).optional(),
  dimensions: z.number().int().positive().optional(),
  user: z.string().optional(),
});

export type EmbeddingRequest = z.infer<typeof embeddingRequestSchema>;

export const embeddingResponseSchema = z.object({
  object: z.literal('list'),
  data: z.array(z.object({
    object: z.literal('embedding'),
    embedding: z.array(z.number()),
    index: z.number().int(),
  })),
  model: z.string(),
  usage: z.object({
    promptTokens: z.number().int(),
    totalTokens: z.number().int(),
  }),
});

export type EmbeddingResponse = z.infer<typeof embeddingResponseSchema>;

// Speech-to-text
export const transcriptionRequestSchema = z.object({
  model: z.string(),
  file: z.instanceof(File).optional(), // For multipart
  fileUrl: z.string().url().optional(),
  language: z.string().optional(),
  prompt: z.string().optional(),
  responseFormat: z.enum(['json', 'text', 'srt', 'vtt', 'verbose_json']).default('json'),
  temperature: z.number().min(0).max(1).optional(),
  timestampGranularities: z.array(z.enum(['word', 'segment'])).optional(),
});

export type TranscriptionRequest = z.infer<typeof transcriptionRequestSchema>;

export const transcriptionResponseSchema = z.object({
  text: z.string(),
  language: z.string().optional(),
  duration: z.number().optional(),
  words: z.array(z.object({
    word: z.string(),
    start: z.number(),
    end: z.number(),
    confidence: z.number().optional(),
  })).optional(),
  segments: z.array(z.object({
    id: z.number().int(),
    seek: z.number().int(),
    start: z.number(),
    end: z.number(),
    text: z.string(),
    tokens: z.array(z.number().int()),
    temperature: z.number(),
    avgLogprob: z.number(),
    compressionRatio: z.number(),
    noSpeechProb: z.number(),
  })).optional(),
});

export type TranscriptionResponse = z.infer<typeof transcriptionResponseSchema>;

// Text-to-speech
export const ttsRequestSchema = z.object({
  model: z.string(),
  input: z.string(),
  voice: z.string(),
  responseFormat: z.enum(['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm']).default('mp3'),
  speed: z.number().min(0.25).max(4.0).default(1.0),
});

export type TTSRequest = z.infer<typeof ttsRequestSchema>;

// AI Usage tracking
export const aiUsageSchema = baseEntitySchema.extend({
  workspaceId: uuidSchema,
  userId: uuidSchema,
  provider: modelProviderSchema,
  model: z.string(),
  operation: z.enum(['chat', 'embedding', 'transcription', 'tts', 'vision']),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  estimatedCost: z.number().nonnegative().optional(),
  requestId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AIUsage = z.infer<typeof aiUsageSchema>;

// AI Agent/Workflow types (future)
export const agentConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  model: z.string(),
  systemPrompt: z.string(),
  tools: z.array(z.string()),
  maxIterations: z.number().int().positive().default(10),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;