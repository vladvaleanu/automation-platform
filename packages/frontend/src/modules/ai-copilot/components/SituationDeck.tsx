/**
 * SituationDeck Component
 * Displays the live alert incidents in Summary or Expanded view
 */

import { useState } from 'react';
import { Incident } from '../types';
import { IncidentCard } from './IncidentCard';
import {
    ListBulletIcon,
    Squares2X2Icon,
    BellAlertIcon,
} from '@heroicons/react/24/outline';

interface SituationDeckProps {
    onChatWithIncident?: (incident: Incident) => void;
}

// Mock data for Phase 1
const MOCK_INCIDENTS: Incident[] = [
    {
        id: '1',
        title: 'Multiple PDU Failures Detected',
        severity: 'critical',
        status: 'active',
        impact: 'Affects 12 Racks across Zone A',
        duration: '4m 20s',
        alertCount: 8,
        hasForgeAnalysis: true,
        createdAt: new Date(Date.now() - 260000),
        alerts: [
            {
                id: 'a1',
                source: 'pdu-monitor',
                message: 'PDU-A1-01 voltage drop below threshold (198V)',
                timestamp: new Date(Date.now() - 260000),
                labels: { rack: 'A1', pdu: 'PDU-01' },
            },
            {
                id: 'a2',
                source: 'pdu-monitor',
                message: 'PDU-A1-02 current spike detected (32A)',
                timestamp: new Date(Date.now() - 240000),
                labels: { rack: 'A1', pdu: 'PDU-02' },
            },
            {
                id: 'a3',
                source: 'ups-monitor',
                message: 'UPS Zone-A battery discharge initiated',
                timestamp: new Date(Date.now() - 220000),
                labels: { zone: 'A', device: 'UPS-01' },
            },
        ],
    },
    {
        id: '2',
        title: 'Cooling Efficiency Degraded',
        severity: 'warning',
        status: 'investigating',
        impact: 'Zone B temperature rising (+2.3°C)',
        duration: '12m 45s',
        alertCount: 4,
        hasForgeAnalysis: true,
        createdAt: new Date(Date.now() - 765000),
        alerts: [
            {
                id: 'b1',
                source: 'hvac-monitor',
                message: 'CRAC-B2 supply temperature above setpoint',
                timestamp: new Date(Date.now() - 765000),
                labels: { zone: 'B', unit: 'CRAC-B2' },
            },
            {
                id: 'b2',
                source: 'sensor-grid',
                message: 'Hot aisle temperature rising: Row B-4',
                timestamp: new Date(Date.now() - 600000),
                labels: { zone: 'B', row: 'B-4' },
            },
        ],
    },
    {
        id: '3',
        title: 'Network Switch Port Errors',
        severity: 'info',
        status: 'active',
        impact: 'ToR switch in Rack C-12',
        duration: '2m 10s',
        alertCount: 2,
        hasForgeAnalysis: false,
        createdAt: new Date(Date.now() - 130000),
        alerts: [
            {
                id: 'c1',
                source: 'network-monitor',
                message: 'Interface Eth1/24 CRC errors increasing',
                timestamp: new Date(Date.now() - 130000),
                labels: { rack: 'C-12', switch: 'ToR-C12', port: 'Eth1/24' },
            },
        ],
    },
];

type ViewMode = 'summary' | 'expanded';

export function SituationDeck({ onChatWithIncident }: SituationDeckProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('summary');
    const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);

    const handleExpand = (incidentId: string) => {
        setExpandedIncidentId(prev => (prev === incidentId ? null : incidentId));
    };

    const handleDismiss = (incidentId: string) => {
        setIncidents(prev => prev.filter(i => i.id !== incidentId));
    };

    const handleChatWithForge = (incident: Incident) => {
        onChatWithIncident?.(incident);
    };

    const criticalCount = incidents.filter(i => i.severity === 'critical').length;
    const warningCount = incidents.filter(i => i.severity === 'warning').length;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <BellAlertIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Situation Deck
                            </h2>
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-2">
                            {criticalCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full animate-pulse">
                                    {criticalCount} Critical
                                </span>
                            )}
                            {warningCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500 text-black rounded-full">
                                    {warningCount} Warning
                                </span>
                            )}
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <button
                            onClick={() => setViewMode('summary')}
                            className={`
                p-1.5 rounded-md transition-colors
                ${viewMode === 'summary'
                                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
              `}
                            title="Summary View"
                        >
                            <Squares2X2Icon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('expanded')}
                            className={`
                p-1.5 rounded-md transition-colors
                ${viewMode === 'expanded'
                                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
              `}
                            title="Expanded View"
                        >
                            <ListBulletIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Incidents List */}
            <div className="flex-1 overflow-y-auto p-4">
                {incidents.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
                        <div className="text-center">
                            <BellAlertIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium">All Clear</p>
                            <p className="text-xs">No active incidents</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {incidents.map(incident => (
                            <IncidentCard
                                key={incident.id}
                                incident={incident}
                                isExpanded={viewMode === 'expanded' || expandedIncidentId === incident.id}
                                onExpand={() => handleExpand(incident.id)}
                                onChatWithForge={() => handleChatWithForge(incident)}
                                onDismiss={() => handleDismiss(incident.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
