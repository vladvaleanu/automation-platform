/**
 * IncidentsPage - Core Monitoring Page
 * Displays the Situation Deck for live incident monitoring
 * Phase 3: Connected to real API via AlertBatcherService
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Incident, IncidentDto } from '../../types/monitoring.types';
import { monitoringApi } from '../../api/monitoring';
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
    BellAlertIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Button, Card, PageHeader, Badge, LoadingState } from '../../components/ui';
import { SituationDeck } from '../../components/monitoring/SituationDeck';

/**
 * Calculate duration string from start date
 */
function calculateDuration(startDate: Date | string): string {
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
}

/**
 * Transform API incident (DTO) to frontend Incident type
 */
function transformIncident(dto: IncidentDto): Incident {
    return {
        id: dto.id,
        title: dto.title,
        severity: dto.severity,
        status: dto.status,
        impact: dto.impact || 'No impact assessment',
        duration: calculateDuration(dto.createdAt),
        alertCount: dto.alertCount,
        hasForgeAnalysis: dto.hasForgeAnalysis,
        createdAt: new Date(dto.createdAt),
        alerts: dto.alerts,
    };
}

export default function IncidentsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch incidents with auto-refresh
    const {
        data: incidentsResponse,
        isLoading,
        isError,
        error,
        refetch,
        isRefetching,
    } = useQuery({
        queryKey: ['incidents', 'active'],
        queryFn: () => monitoringApi.getIncidents('active'),
        refetchInterval: 5000, // Refresh every 5 seconds
        staleTime: 2000,
    });

    // Mutation for dismissing incidents
    const dismissMutation = useMutation({
        mutationFn: (incidentId: string) =>
            monitoringApi.updateIncident(incidentId, { status: 'dismissed' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
        },
    });

    const incidents: Incident[] = incidentsResponse?.success && Array.isArray(incidentsResponse.data)
        ? incidentsResponse.data.map(transformIncident)
        : [];

    const handleDismiss = (incidentId: string) => {
        dismissMutation.mutate(incidentId);
    };

    const handleChatWithForge = (incident: Incident) => {
        // Open Forge chat with incident context
        localStorage.setItem('forge-context-incident', JSON.stringify(incident));
        navigate('/modules/ai-copilot/chat');
    };

    const handleRefresh = () => {
        refetch();
    };

    const criticalCount = incidents.filter(i => i.severity === 'critical').length;
    const warningCount = incidents.filter(i => i.severity === 'warning').length;
    const infoCount = incidents.filter(i => i.severity === 'info').length;

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 p-6 overflow-hidden">
            <PageHeader
                title="Incidents"
                description="Live Infrastructure Monitoring"
                icon={
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                        <BellAlertIcon className="h-5 w-5 text-white" />
                    </div>
                }
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={handleRefresh}
                            disabled={isRefetching}
                            leftIcon={<ArrowPathIcon className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />}
                        >
                            Refresh
                        </Button>

                        <Button
                            onClick={() => navigate('/modules/ai-copilot/chat')}
                            leftIcon={<SparklesIcon className="h-4 w-4" />}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            Ask Forge
                        </Button>
                    </div>
                }
            >
                {/* Status Summary Pills */}
                <div className="flex items-center gap-2">
                    {criticalCount > 0 && (
                        <Badge variant="error" className="animate-pulse">
                            {criticalCount} Critical
                        </Badge>
                    )}
                    {warningCount > 0 && (
                        <Badge variant="warning">
                            {warningCount} Warning
                        </Badge>
                    )}
                    {infoCount > 0 && (
                        <Badge variant="info">
                            {infoCount} Info
                        </Badge>
                    )}
                    {!isLoading && incidents.length === 0 && (
                        <Badge variant="success">
                            All Clear
                        </Badge>
                    )}
                </div>
            </PageHeader>

            {/* Incidents List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <Card className="flex items-center justify-center p-12">
                        <LoadingState text="Loading incidents..." />
                    </Card>
                ) : isError ? (
                    <Card className="flex items-center justify-center p-12 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                Failed to Load Incidents
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                {(error as Error)?.message || 'Unable to fetch incidents'}
                            </p>
                            <Button onClick={() => refetch()} variant="secondary">
                                Try Again
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <SituationDeck
                        incidents={incidents}
                        onRefresh={handleRefresh}
                        onDismiss={handleDismiss}
                        onChatWithForge={handleChatWithForge}
                    />
                )}
            </div>
        </div>
    );
}

