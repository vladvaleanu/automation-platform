/**
 * Core Monitoring Types
 * Types for incident monitoring and alerting system
 */

// Severity levels for incidents
export type IncidentSeverity = 'critical' | 'warning' | 'info';

// Status of an incident
export type IncidentStatus = 'active' | 'investigating' | 'resolved';

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
