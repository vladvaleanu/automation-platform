/**
 * AI Copilot Routes
 * API endpoints for Forge AI assistant
 * 
 * All routes prefixed with /api/v1/m/ai-copilot/
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ModuleContext, ChatRequest, HealthResponse, AiConfig } from '../types/index.js';
import { OllamaService } from '../services/ollama.service.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { KnowledgeService } from '../services/knowledge.service.js';

// In-memory cache for config (will be replaced with DB read)
let cachedConfig: AiConfig | null = null;

/**
 * Get or create default config
 */
async function getConfig(context: ModuleContext): Promise<AiConfig> {
    if (cachedConfig) return cachedConfig;

    const { prisma, logger } = context.services;

    try {
        // Try to get existing config from the ai_config table
        const result = await prisma.$queryRaw<AiConfig[]>`
      SELECT 
        id,
        provider,
        base_url as "baseUrl",
        model,
        strictness,
        context_window as "contextWindow",
        embedding_model as "embeddingModel",
        batch_window_seconds as "batchWindowSeconds",
        persona_name as "personaName",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ai_config
      LIMIT 1
    `;

        if (result.length > 0) {
            cachedConfig = result[0];
            return cachedConfig;
        }
    } catch (error) {
        // Table might not exist yet, use defaults
        logger.warn({ error }, 'ai_config table not found, using defaults');
    }

    // Return default config
    return {
        id: 'default',
        provider: 'ollama',
        baseUrl: 'http://localhost:11434',
        model: 'llama3.1',
        strictness: 5,
        contextWindow: 32768,
        embeddingModel: null,
        batchWindowSeconds: 30,
        personaName: 'Forge',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Get or create OllamaService instance
 */
let ollamaService: OllamaService | null = null;

async function getOllamaService(context: ModuleContext): Promise<OllamaService> {
    const config = await getConfig(context);

    if (!ollamaService) {
        ollamaService = new OllamaService(
            { baseUrl: config.baseUrl, model: config.model },
            context.services.logger
        );
    } else {
        ollamaService.updateConfig({ baseUrl: config.baseUrl, model: config.model });
    }

    return ollamaService;
}

/**
 * Get or create KnowledgeService instance
 */
let knowledgeService: KnowledgeService | null = null;

async function getKnowledgeService(context: ModuleContext): Promise<KnowledgeService> {
    if (!knowledgeService) {
        const config = await getConfig(context);
        const embeddingService = new EmbeddingService(
            { baseUrl: config.baseUrl },
            context.services.logger
        );
        knowledgeService = new KnowledgeService({
            prisma: context.services.prisma,
            embedding: embeddingService,
            logger: context.services.logger,
            topK: 5,
            minSimilarity: 0.3,
        });
    }
    return knowledgeService;
}

/**
 * Register all AI Copilot routes
 */
export async function registerRoutes(
    fastify: FastifyInstance,
    context: ModuleContext
): Promise<void> {
    const { logger } = context.services;

    /**
     * GET /health - Health check with Ollama status
     */
    fastify.get('/health', async (_request, reply): Promise<HealthResponse> => {
        const ollama = await getOllamaService(context);
        const config = await getConfig(context);
        const health = await ollama.healthCheck();

        return {
            module: 'ai-copilot',
            status: health.connected ? 'ok' : 'degraded',
            ollama: health.connected,
            model: config.model,
            availableModels: health.models.map((m) => m.name),
        };
    });

    /**
     * GET /models - List available Ollama models
     */
    fastify.get('/models', async (_request, reply) => {
        const ollama = await getOllamaService(context);

        try {
            const models = await ollama.listModels();
            return {
                success: true,
                models: models.map((m) => ({
                    name: m.name,
                    size: m.size,
                    parameterSize: m.details.parameterSize,
                    family: m.details.family,
                })),
            };
        } catch (error) {
            logger.error({ error }, 'Failed to list models');
            reply.status(503);
            return {
                success: false,
                error: 'Unable to connect to Ollama',
                models: [],
            };
        }
    });

    /**
     * GET /settings - Get current AI configuration
     */
    fastify.get('/settings', async (_request, reply) => {
        const config = await getConfig(context);
        return {
            success: true,
            settings: {
                provider: config.provider,
                baseUrl: config.baseUrl,
                model: config.model,
                strictness: config.strictness,
                contextWindow: config.contextWindow,
                embeddingModel: config.embeddingModel,
                batchWindowSeconds: config.batchWindowSeconds,
                personaName: config.personaName,
            },
        };
    });

    /**
     * PUT /settings - Update AI configuration
     */
    fastify.put('/settings', async (request: FastifyRequest, reply) => {
        const body = request.body as Partial<AiConfig>;
        const { prisma } = context.services;

        try {
            // Build SET clause dynamically
            const updates: string[] = [];
            const values: any[] = [];

            if (body.provider) {
                updates.push('provider = $' + (values.length + 1));
                values.push(body.provider);
            }
            if (body.baseUrl) {
                updates.push('base_url = $' + (values.length + 1));
                values.push(body.baseUrl);
            }
            if (body.model) {
                updates.push('model = $' + (values.length + 1));
                values.push(body.model);
            }
            if (body.strictness !== undefined) {
                updates.push('strictness = $' + (values.length + 1));
                values.push(body.strictness);
            }
            if (body.contextWindow !== undefined) {
                updates.push('context_window = $' + (values.length + 1));
                values.push(body.contextWindow);
            }
            if (body.personaName) {
                updates.push('persona_name = $' + (values.length + 1));
                values.push(body.personaName);
            }

            updates.push('updated_at = NOW()');

            if (updates.length > 1) {
                await prisma.$executeRawUnsafe(
                    `UPDATE ai_config SET ${updates.join(', ')} WHERE id = (SELECT id FROM ai_config LIMIT 1)`,
                    ...values
                );
                // Clear cache to force reload
                cachedConfig = null;
            }

            const config = await getConfig(context);

            // Update Ollama service with new config
            if (ollamaService) {
                ollamaService.updateConfig({ baseUrl: config.baseUrl, model: config.model });
            }

            return {
                success: true,
                settings: {
                    provider: config.provider,
                    baseUrl: config.baseUrl,
                    model: config.model,
                    strictness: config.strictness,
                    contextWindow: config.contextWindow,
                    personaName: config.personaName,
                },
            };
        } catch (error) {
            logger.error({ error }, 'Failed to update settings');
            reply.status(500);
            return {
                success: false,
                error: 'Failed to update settings',
            };
        }
    });

    /**
     * POST /chat - Send message to Forge
     */
    fastify.post('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
        const body = request.body as ChatRequest;
        const ollama = await getOllamaService(context);
        const config = await getConfig(context);

        if (!body.message) {
            reply.status(400);
            return { success: false, error: 'Message is required' };
        }

        // Get RAG context from knowledge base
        let ragContext = '';
        try {
            const knowledge = await getKnowledgeService(context);
            const knowledgeContext = await knowledge.getContext(body.message);
            ragContext = knowledgeContext.formattedContext;

            if (knowledgeContext.documents.length > 0) {
                logger.info({
                    query: body.message.substring(0, 50),
                    documentsFound: knowledgeContext.documents.length
                }, 'RAG context retrieved');
            }
        } catch (error) {
            logger.warn({ error }, 'Failed to get RAG context, proceeding without it');
        }

        // Build system prompt based on config + RAG context
        const systemPrompt = buildSystemPrompt(config, ragContext);

        // Build messages array
        const messages = [{ role: 'user' as const, content: body.message }];

        // Handle streaming vs non-streaming
        if (body.stream === true) {
            // Set headers for SSE
            reply.raw.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            });

            try {
                for await (const chunk of ollama.chatStream(messages, systemPrompt)) {
                    reply.raw.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
                }
                reply.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                reply.raw.end();
            } catch (error) {
                logger.error({ error }, 'Chat stream error');
                reply.raw.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
                reply.raw.end();
            }
            return;
        }

        // Non-streaming response
        try {
            const response = await ollama.chat(messages, systemPrompt);
            return {
                success: true,
                response: response.message,
                model: response.model,
                done: response.done,
            };
        } catch (error) {
            logger.error({ error }, 'Chat request failed');
            reply.status(503);
            return {
                success: false,
                error: 'Unable to get response from Forge. Is Ollama running?',
            };
        }
    });

    /**
     * GET /knowledge - Get all AI-accessible documents (admin view)
     */
    fastify.get('/knowledge', async (_request, reply) => {
        const { prisma } = context.services;

        try {
            const documents = await prisma.$queryRawUnsafe<{
                id: string;
                title: string;
                excerpt: string | null;
                status: string;
                category_name: string;
                ai_accessible: boolean;
                has_embedding: boolean;
                updated_at: Date;
            }[]>(`
                SELECT
                    d.id,
                    d.title,
                    d.excerpt,
                    d.status,
                    c.name as category_name,
                    d.ai_accessible,
                    (d.embedding IS NOT NULL) as has_embedding,
                    d.updated_at
                FROM documents d
                LEFT JOIN document_categories c ON d.category_id = c.id
                WHERE d.status = 'PUBLISHED'
                ORDER BY d.ai_accessible DESC, d.updated_at DESC
            `);

            return {
                success: true,
                documents: documents.map(d => ({
                    id: d.id,
                    title: d.title,
                    excerpt: d.excerpt,
                    status: d.status,
                    categoryName: d.category_name,
                    aiAccessible: d.ai_accessible,
                    hasEmbedding: d.has_embedding,
                    updatedAt: d.updated_at,
                })),
            };
        } catch (error) {
            logger.error({ error }, 'Failed to fetch knowledge documents');
            reply.status(500);
            return {
                success: false,
                error: 'Failed to fetch knowledge documents',
                documents: [],
            };
        }
    });

    /**
     * GET /knowledge/stats - Get knowledge base statistics
     */
    fastify.get('/knowledge/stats', async (_request, reply) => {
        try {
            const knowledge = await getKnowledgeService(context);
            const stats = await knowledge.getStats();

            return {
                success: true,
                stats: {
                    totalAiAccessible: stats.total,
                    totalEmbedded: stats.embedded,
                    pendingEmbedding: stats.total - stats.embedded,
                },
            };
        } catch (error) {
            logger.error({ error }, 'Failed to fetch knowledge stats');
            reply.status(500);
            return {
                success: false,
                error: 'Failed to fetch knowledge stats',
            };
        }
    });

    /**
     * POST /knowledge/search - Search knowledge base (for testing RAG)
     */
    fastify.post('/knowledge/search', async (request: FastifyRequest, reply) => {
        const { query, limit } = request.body as { query: string; limit?: number };

        if (!query) {
            reply.status(400);
            return { success: false, error: 'Query is required' };
        }

        try {
            const knowledge = await getKnowledgeService(context);
            const results = await knowledge.findRelevant(query, limit || 5);

            return {
                success: true,
                results: results.map(doc => ({
                    id: doc.id,
                    title: doc.title,
                    excerpt: doc.excerpt,
                    categoryName: doc.categoryName,
                    similarity: Math.round(doc.similarity * 100) / 100,
                })),
            };
        } catch (error) {
            logger.error({ error }, 'Knowledge search failed');
            reply.status(500);
            return {
                success: false,
                error: 'Knowledge search failed',
                results: [],
            };
        }
    });

    logger.info('[ai-copilot] Routes registered');
}

/**
 * Build system prompt based on configuration
 */
function buildSystemPrompt(config: AiConfig, ragContext?: string): string {
    const strictnessDescriptions: Record<number, string> = {
        1: 'helpful and friendly',
        2: 'helpful and informative',
        3: 'professional and helpful',
        4: 'professional and focused',
        5: 'balanced advisor',
        6: 'strict advisor',
        7: 'disciplined operator',
        8: 'strict protocol follower',
        9: 'military precision',
        10: 'absolutely strict, no deviations',
    };

    const strictnessLevel = strictnessDescriptions[config.strictness] || 'balanced advisor';

    let prompt = `You are ${config.personaName}, an AI infrastructure operator assistant for datacenter operations.

Your personality: ${strictnessLevel}

Your responsibilities:
- Help operators manage datacenter infrastructure (power, cooling, network)
- Follow Standard Operating Procedures (SOPs) strictly
- Provide clear, actionable guidance
- Never recommend actions outside your domain
- Alert operators to potential issues
- Explain the reasoning behind your recommendations

Important rules:
- You operate within the datacenter infrastructure domain only
- You do not have access to customer server configurations
- Always prioritize safety and stability
- When unsure, recommend consulting documentation or escalating`;

    // Add RAG context if available
    if (ragContext && ragContext.trim()) {
        prompt += `

${ragContext}

When answering questions, prioritize information from the documentation provided above.
If the documentation contains relevant procedures or policies, cite them in your response.`;
    }

    prompt += `

Current context: Datacenter operations assistant ready to help.`;

    return prompt;
}
