/**
 * IncidentsPage - Core Monitoring Page
 * Displays the Situation Deck for live incident monitoring
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Incident } from '../../types/monitoring.types';
import { IncidentCard } from '../../components/monitoring/IncidentCard';
import {
    ListBulletIcon,
    Squares2X2Icon,
    BellAlertIcon,
    SparklesIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

// Mock data for Phase 1 - will be replaced with real API calls
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

export default function IncidentsPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('summary');
    const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleExpand = (incidentId: string) => {
        setExpandedIncidentId(prev => (prev === incidentId ? null : incidentId));
    };

    const handleDismiss = (incidentId: string) => {
        setIncidents(prev => prev.filter(i => i.id !== incidentId));
    };

    const handleChatWithForge = (incident: Incident) => {
        // Open Forge chat with incident context
        localStorage.setItem('forge-context-incident', JSON.stringify(incident));
        window.location.href = '/modules/ai-copilot/chat';
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        // Simulate refresh
        setTimeout(() => {
            setIncidents(MOCK_INCIDENTS);
            setIsRefreshing(false);
        }, 1000);
    };

    const criticalCount = incidents.filter(i => i.severity === 'critical').length;
    const warningCount = incidents.filter(i => i.severity === 'warning').length;
    const infoCount = incidents.filter(i => i.severity === 'info').length;

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
            {/* Page Header */}
            <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                                <BellAlertIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Incidents
                                </h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Live Infrastructure Monitoring
                                </p>
                            </div>
                        </div>

                        {/* Status Summary Pills */}
                        <div className="flex items-center gap-2 ml-4">
                            {criticalCount > 0 && (
                                <span className="px-2.5 py-1 text-xs font-medium bg-red-500 text-white rounded-full animate-pulse">
                                    {criticalCount} Critical
                                </span>
                            )}
                            {warningCount > 0 && (
                                <span className="px-2.5 py-1 text-xs font-medium bg-yellow-500 text-black rounded-full">
                                    {warningCount} Warning
                                </span>
                            )}
                            {infoCount > 0 && (
                                <span className="px-2.5 py-1 text-xs font-medium bg-blue-500 text-white rounded-full">
                                    {infoCount} Info
                                </span>
                            )}
                            {incidents.length === 0 && (
                                <span className="px-2.5 py-1 text-xs font-medium bg-green-500 text-white rounded-full">
                                    All Clear
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <button
                                onClick={() => setViewMode('summary')}
                                className={`
                                    p-2 rounded-md transition-colors
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
                                    p-2 rounded-md transition-colors
                                    ${viewMode === 'expanded'
                                        ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
                                `}
                                title="Expanded View"
                            >
                                <ListBulletIcon className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Ask Forge Button */}
                        <Link
                            to="/modules/ai-copilot/chat"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                            <SparklesIcon className="h-4 w-4" />
                            Ask Forge
                        </Link>
                    </div>
                </div>
            </div>

            {/* Incidents List */}
            <div className="flex-1 overflow-y-auto p-6">
                {incidents.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                <BellAlertIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                All Clear
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No active incidents at this time
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-4">
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
