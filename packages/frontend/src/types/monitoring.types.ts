/**
 * Core Monitoring Types
 * Types for incident monitoring and alerting system
 */

// Severity levels for incidents
export type IncidentSeverity = 'critical' | 'warning' | 'info';

// Status of an incident
export type IncidentStatus = 'active' | 'investigating' | 'resolved' | 'dismissed';

// Individual raw alert from monitoring
export interface RawAlert {
    id: string;
    source: string;
    message: string;
    timestamp: Date;
    labels: Record<string, string>;
}

// Grouped incident (multiple alerts)
export interface Incident {
    id: string;
    title: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    impact: string;
    duration: string;
    alertCount: number;
    hasForgeAnalysis: boolean;
    createdAt: Date;
    alerts?: RawAlert[];
}

// API Response DTO for Incident (matches Prisma model + serialization)
export interface IncidentDto {
    id: string;
    title: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    impact: string | null;
    alert_count: number; // Maps to alertCount in Prisma (mapped) or raw? Prisma default returns camelCase if using class, but over network it's JSON.
    // Wait. Prisma Client returns camelCase objects (e.g. alertCount). 
    // Fastify/res.send sends them as JSON.
    // If Prisma model has @map("alert_count"), that's for DB column. The field name is `alertCount`.
    // So JSON will have `alertCount`.
    alertCount: number;
    hasForgeAnalysis: boolean;
    createdAt: string; // JSON date
    updatedAt: string;
    resolvedAt: string | null;
    alerts?: RawAlert[]; // Alerts might be included
}
