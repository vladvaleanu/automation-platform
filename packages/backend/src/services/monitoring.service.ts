import { PrismaClient, Incident, IncidentStatus, IncidentSeverity, AlertSeverity } from '@prisma/client';

export class MonitoringService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Get all incidents, optionally filtered by status
     */
    async getIncidents(status?: IncidentStatus): Promise<Incident[]> {
        const where = status ? { status } : {};
        return this.prisma.incident.findMany({
            where,
            orderBy: [
                // Order by severity (critical first) then created date
                { severity: 'asc' }, // enum sorting might need adjustment if not alphabetic, but let's trust default for now or fix later
                { createdAt: 'desc' }
            ],
            include: {
                alerts: true,
            },
        });
    }

    /**
     * Get a single incident by ID
     */
    async getIncident(id: string): Promise<Incident | null> {
        return this.prisma.incident.findUnique({
            where: { id },
            include: {
                alerts: {
                    orderBy: { createdAt: 'desc' }
                },
            },
        });
    }

    /**
     * Update incident status
     */
    async updateIncident(id: string, updates: {
        status?: IncidentStatus;
        hasForgeAnalysis?: boolean;
        impact?: string;
    }): Promise<Incident> {
        return this.prisma.incident.update({
            where: { id },
            data: {
                ...updates,
                resolvedAt: updates.status === 'resolved' || updates.status === 'dismissed' ? new Date() : undefined
            },
            include: {
                alerts: true,
            },
        });
    }

    /**
     * Create a new incident (Internal/Module use)
     */
    async createIncident(data: {
        title: string;
        severity: IncidentSeverity;
        impact?: string;
        alerts?: {
            create: {
                source: string;
                message: string;
                severity: AlertSeverity;
                labels?: any;
            }[]
        }
    }): Promise<Incident> {
        return this.prisma.incident.create({
            data: {
                ...data,
                status: 'active',
                alertCount: data.alerts?.create?.length || 0,
            },
            include: {
                alerts: true,
            },
        });
    }
}
