/**
 * Alert Batcher Service
 * Groups related alerts into incidents based on time windows and shared labels
 */

import type { Logger } from 'pino';
import type { PrismaClient } from '@prisma/client';
import type {
    RawAlert,
    Incident,
    AlertSeverity,
    AlertBatcherConfig,
    AlertGroup,
    AlertIngestRequest,
} from '../types/alert.types.js';

// Severity priority for determining incident severity
const SEVERITY_PRIORITY: Record<AlertSeverity, number> = {
    critical: 3,
    warning: 2,
    info: 1,
};

/**
 * AlertBatcherService - Groups alerts into incidents
 */
export class AlertBatcherService {
    private prisma: PrismaClient;
    private logger: Logger;
    private config: AlertBatcherConfig;
    private alertBuffer: RawAlert[] = [];
    private batchInterval: NodeJS.Timeout | null = null;
    private isRunning = false;

    constructor(
        prisma: PrismaClient,
        logger: Logger,
        config: Partial<AlertBatcherConfig> = {}
    ) {
        this.prisma = prisma;
        this.logger = logger.child({ service: 'alert-batcher' });
        this.config = {
            batchWindowSeconds: config.batchWindowSeconds ?? 30,
            minAlertsForIncident: config.minAlertsForIncident ?? 1,
        };
    }

    /**
     * Start the batcher - processes alerts at configured intervals
     */
    start(): void {
        if (this.isRunning) {
            this.logger.warn('AlertBatcherService already running');
            return;
        }

        this.isRunning = true;
        this.batchInterval = setInterval(
            () => this.processBatch(),
            this.config.batchWindowSeconds * 1000
        );

        this.logger.info(
            { batchWindowSeconds: this.config.batchWindowSeconds },
            'AlertBatcherService started'
        );
    }

    /**
     * Stop the batcher
     */
    stop(): void {
        if (this.batchInterval) {
            clearInterval(this.batchInterval);
            this.batchInterval = null;
        }
        this.isRunning = false;
        this.logger.info('AlertBatcherService stopped');
    }

    /**
     * Ingest a new alert into the buffer
     */
    async ingestAlert(request: AlertIngestRequest): Promise<RawAlert> {
        const alert: RawAlert = {
            id: this.generateId(),
            source: request.source,
            message: request.message,
            severity: request.severity || 'info',
            labels: request.labels || {},
            incidentId: null,
            createdAt: new Date(),
        };

        // Store alert in database immediately
        try {
            await this.prisma.alert.create({
                data: {
                    id: alert.id,
                    source: alert.source,
                    message: alert.message,
                    severity: alert.severity,
                    labels: alert.labels, // Prisma Json type
                    createdAt: alert.createdAt,
                    incidentId: null
                }
            });
        } catch (error) {
            this.logger.error({ error, alert }, 'Failed to store alert in database');
            throw error;
        }

        // Add to buffer for batching
        this.alertBuffer.push(alert);
        this.logger.debug({ alertId: alert.id, source: alert.source }, 'Alert ingested');

        return alert;
    }

    /**
     * Process buffered alerts and create/update incidents
     */
    async processBatch(): Promise<void> {
        if (this.alertBuffer.length === 0) {
            return;
        }

        const alertsToProcess = [...this.alertBuffer];
        this.alertBuffer = [];

        this.logger.info({ alertCount: alertsToProcess.length }, 'Processing alert batch');

        // Group alerts by source + shared labels
        const groups = this.groupAlerts(alertsToProcess);

        for (const group of groups) {
            await this.createOrUpdateIncident(group);
        }
    }

    /**
     * Group alerts by source and shared labels
     */
    private groupAlerts(alerts: RawAlert[]): AlertGroup[] {
        const groupMap = new Map<string, AlertGroup>();

        for (const alert of alerts) {
            // Create grouping key from source + sorted label keys/values
            const labelParts = Object.entries(alert.labels)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => `${k}:${v}`);
            const key = `${alert.source}|${labelParts.join('|')}`;

            if (!groupMap.has(key)) {
                groupMap.set(key, {
                    key,
                    alerts: [],
                    severity: alert.severity,
                    source: alert.source,
                    sharedLabels: { ...alert.labels },
                });
            }

            const group = groupMap.get(key)!;
            group.alerts.push(alert);

            // Update group severity to highest priority
            if (SEVERITY_PRIORITY[alert.severity] > SEVERITY_PRIORITY[group.severity]) {
                group.severity = alert.severity;
            }
        }

        return Array.from(groupMap.values());
    }

    /**
     * Create a new incident or update existing one from alert group
     */
    private async createOrUpdateIncident(group: AlertGroup): Promise<Incident> {
        // Check for existing active incident with same source and labels
        const existingIncident = await this.prisma.incident.findFirst({
            where: {
                status: { in: ['active', 'investigating'] },
                title: { contains: group.source }, // Simple heuristic, might need robust matching
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, severity: true },
        });

        if (existingIncident) {
            // Update existing incident
            return await this.addAlertsToIncident(existingIncident.id, group);
        }

        // Create new incident
        return await this.createIncident(group);
    }

    /**
     * Create a new incident from an alert group
     */
    private async createIncident(group: AlertGroup): Promise<Incident> {
        const title = this.generateIncidentTitle(group);
        const impact = this.generateImpactDescription(group);

        try {
            const incident = await this.prisma.incident.create({
                data: {
                    title,
                    severity: group.severity,
                    status: 'active',
                    impact,
                    alertCount: group.alerts.length,
                    createdAt: new Date(),
                    alerts: {
                        connect: group.alerts.map(a => ({ id: a.id }))
                    }
                },
                include: { alerts: true }
            });

            this.logger.info(
                { incidentId: incident.id, title, alertCount: group.alerts.length },
                'Created new incident'
            );

            return this.mapPrismaIncidentToType(incident);
        } catch (error) {
            this.logger.error({ error, group }, 'Failed to create incident');
            throw error;
        }
    }

    /**
     * Add alerts to an existing incident
     */
    private async addAlertsToIncident(incidentId: string, group: AlertGroup): Promise<Incident> {
        try {
            // Link alerts to incident
            await this.prisma.alert.updateMany({
                where: { id: { in: group.alerts.map(a => a.id) } },
                data: { incidentId }
            });

            // Get current incident to check severity
            const currentIncident = await this.prisma.incident.findUnique({
                where: { id: incidentId }
            });

            if (!currentIncident) throw new Error('Incident not found');

            // Determine new severity
            let newSeverity = currentIncident.severity;
            if (SEVERITY_PRIORITY[group.severity] > SEVERITY_PRIORITY[currentIncident.severity]) {
                newSeverity = group.severity;
            }

            // Update incident alert count and severity
            const alertCount = await this.prisma.alert.count({ where: { incidentId } });

            await this.prisma.incident.update({
                where: { id: incidentId },
                data: {
                    alertCount,
                    severity: newSeverity,
                    updatedAt: new Date()
                }
            });

            this.logger.info(
                { incidentId, newAlerts: group.alerts.length },
                'Added alerts to existing incident'
            );

            // Fetch updated incident
            const updated = await this.getIncidentById(incidentId);
            return updated!;
        } catch (error) {
            this.logger.error({ error, incidentId }, 'Failed to add alerts to incident');
            throw error;
        }
    }

    /**
     * Generate a human-readable incident title
     */
    private generateIncidentTitle(group: AlertGroup): string {
        const sourceLabel = group.source.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        if (group.alerts.length === 1) {
            // Single alert - use its message (truncated)
            return group.alerts[0].message.length > 100
                ? group.alerts[0].message.substring(0, 97) + '...'
                : group.alerts[0].message;
        }

        // Multiple alerts - summarize
        return `${group.alerts.length} ${sourceLabel} Alerts`;
    }

    /**
     * Generate impact description from labels
     */
    private generateImpactDescription(group: AlertGroup): string {
        const parts: string[] = [];

        if (group.sharedLabels.zone) {
            parts.push(`Zone ${group.sharedLabels.zone}`);
        }
        if (group.sharedLabels.rack) {
            parts.push(`Rack ${group.sharedLabels.rack}`);
        }
        if (group.sharedLabels.device) {
            parts.push(group.sharedLabels.device);
        }

        if (parts.length === 0) {
            return `Affects ${group.source}`;
        }

        return `Affects ${parts.join(', ')}`;
    }

    /**
     * Get incident by ID with alerts
     */
    async getIncidentById(id: string): Promise<Incident | null> {
        const incident = await this.prisma.incident.findUnique({
            where: { id },
            include: {
                alerts: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!incident) {
            return null;
        }

        return this.mapPrismaIncidentToType(incident);
    }

    /**
     * Get all active incidents
     */
    async getActiveIncidents(includeAlerts = false): Promise<Incident[]> {
        const incidents = await this.prisma.incident.findMany({
            where: {
                status: { in: ['active', 'investigating'] }
            },
            orderBy: { createdAt: 'desc' }, // Basic sort, refinement in memory if needed
            include: {
                alerts: includeAlerts
            }
        });

        // Manual sort to match severity priority
        incidents.sort((a, b) => {
            const pA = SEVERITY_PRIORITY[a.severity] || 0;
            const pB = SEVERITY_PRIORITY[b.severity] || 0;
            if (pA !== pB) return pB - pA; // Descending priority
            return b.createdAt.getTime() - a.createdAt.getTime();
        });

        return incidents.map(i => this.mapPrismaIncidentToType(i));
    }

    /**
     * Get all incidents (including resolved)
     */
    async getAllIncidents(limit = 50): Promise<Incident[]> {
        const incidents = await this.prisma.incident.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { alerts: false } // Default no alerts for list
        });

        return incidents.map(i => this.mapPrismaIncidentToType(i));
    }

    /**
     * Update incident status
     */
    async updateIncidentStatus(
        id: string,
        status: Incident['status'],
        hasForgeAnalysis?: boolean
    ): Promise<Incident | null> {
        try {
            const data: any = {
                status,
                updatedAt: new Date(),
                resolvedAt: (status === 'resolved' || status === 'dismissed') ? new Date() : null
            };

            if (hasForgeAnalysis !== undefined) {
                data.hasForgeAnalysis = hasForgeAnalysis;
            }

            await this.prisma.incident.update({
                where: { id },
                data
            });

            return await this.getIncidentById(id);
        } catch (error) {
            this.logger.error({ error, id, status }, 'Failed to update incident status');
            throw error;
        }
    }

    /**
     * Get alerts by incident ID
     */
    private async getAlertsByIncidentId(incidentId: string): Promise<RawAlert[]> {
        const alerts = await this.prisma.alert.findMany({
            where: { incidentId },
            orderBy: { createdAt: 'desc' }
        });

        return alerts.map(alert => ({
            id: alert.id,
            source: alert.source,
            message: alert.message,
            severity: alert.severity,
            labels: alert.labels as Record<string, string>,
            incidentId: alert.incidentId,
            createdAt: alert.createdAt,
        }));
    }

    /**
     * Helper to map Prisma Incident to Internal Type
     */
    private mapPrismaIncidentToType(incident: any): Incident {
        return {
            id: incident.id,
            title: incident.title,
            severity: incident.severity,
            status: incident.status as Incident['status'],
            impact: incident.impact,
            alertCount: incident.alertCount,
            hasForgeAnalysis: incident.hasForgeAnalysis,
            createdAt: incident.createdAt,
            updatedAt: incident.updatedAt,
            resolvedAt: incident.resolvedAt,
            alerts: incident.alerts ? incident.alerts.map((a: any) => ({
                id: a.id,
                source: a.source,
                message: a.message,
                severity: a.severity,
                labels: a.labels as Record<string, string>,
                incidentId: a.incidentId,
                createdAt: a.createdAt,
            })) : undefined,
        };
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return crypto.randomUUID();
    }

    /**
     * Calculate duration string from createdAt
     */
    static calculateDuration(createdAt: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);

        if (diffHours > 0) {
            return `${diffHours}h ${diffMinutes % 60}m`;
        }
        if (diffMinutes > 0) {
            return `${diffMinutes}m ${diffSeconds % 60}s`;
        }
        return `${diffSeconds}s`;
    }
}
