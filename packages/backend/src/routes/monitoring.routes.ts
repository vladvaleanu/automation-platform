import { FastifyInstance } from 'fastify';
import { PrismaClient, IncidentStatus } from '@prisma/client';
import { MonitoringService } from '../services/monitoring.service.js';

export async function monitoringRoutes(app: FastifyInstance) {
    const prisma = (app as any).prisma as PrismaClient;
    const monitoringService = new MonitoringService(prisma);

    app.get<{ Querystring: { status?: IncidentStatus } }>(
        '/incidents',
        {
            schema: {
                description: 'Get all incidents',
                tags: ['monitoring'],
                querystring: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['active', 'investigating', 'resolved', 'dismissed'] },
                    },
                },
            },
        },
        async (request) => {
            const { status } = request.query;
            const incidents = await monitoringService.getIncidents(status);
            return { success: true, data: incidents };
        }
    );

    app.get<{ Params: { id: string } }>(
        '/incidents/:id',
        {
            schema: {
                description: 'Get details of a specific incident',
                tags: ['monitoring'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                    required: ['id'],
                },
            },
        },
        async (request, reply) => {
            const { id } = request.params;
            const incident = await monitoringService.getIncident(id);

            if (!incident) {
                return reply.status(404).send({ success: false, error: 'Incident not found' });
            }

            return { success: true, data: incident };
        }
    );

    app.patch<{ Params: { id: string }; Body: { status?: IncidentStatus; hasForgeAnalysis?: boolean } }>(
        '/incidents/:id',
        {
            schema: {
                description: 'Update incident status or metadata',
                tags: ['monitoring'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                    required: ['id'],
                },
                body: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['active', 'investigating', 'resolved', 'dismissed'] },
                        hasForgeAnalysis: { type: 'boolean' },
                    },
                },
            },
        },
        async (request, reply) => {
            const { id } = request.params;
            const updates = request.body;

            try {
                const updatedIncident = await monitoringService.updateIncident(id, updates);
                return { success: true, data: updatedIncident };
            } catch (error) {
                return reply.status(404).send({ success: false, error: 'Incident not found' });
            }
        }
    );
}
