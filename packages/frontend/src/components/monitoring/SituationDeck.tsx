import { useState } from 'react';
import { Incident } from '../../types/monitoring.types';
import { IncidentCard } from './IncidentCard';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import {
    ListBulletIcon,
    Squares2X2Icon,
    BellAlertIcon,
} from '@heroicons/react/24/outline';

interface SituationDeckProps {
    incidents: Incident[];
    isLoading?: boolean;
    onRefresh?: () => void;
    onDismiss: (id: string) => void;
    onChatWithForge?: (incident: Incident) => void;
}

type ViewMode = 'summary' | 'expanded';

export function SituationDeck({
    incidents,
    isLoading = false,
    onRefresh,
    onDismiss,
    onChatWithForge,
}: SituationDeckProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('summary');
    const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);

    const handleExpand = (incidentId: string) => {
        setExpandedIncidentId(prev => (prev === incidentId ? null : incidentId));
    };

    if (!isLoading && incidents.length === 0) {
        return (
            <Card className="flex items-center justify-center p-12">
                <EmptyState
                    icon={<BellAlertIcon className="h-8 w-8 text-green-600 dark:text-green-400" />}
                    title="All Clear"
                    description="No active incidents at this time"
                    action={onRefresh ? {
                        label: 'Refresh',
                        onClick: onRefresh
                    } : undefined}
                />
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-end gap-2">
                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Button
                        size="xs"
                        variant={viewMode === 'summary' ? 'primary' : 'ghost'}
                        onClick={() => setViewMode('summary')}
                        title="Summary View"
                        className={viewMode === 'summary' ? '' : 'text-gray-500'}
                    >
                        <Squares2X2Icon className="h-4 w-4" />
                    </Button>
                    <Button
                        size="xs"
                        variant={viewMode === 'expanded' ? 'primary' : 'ghost'}
                        onClick={() => setViewMode('expanded')}
                        title="Expanded View"
                        className={viewMode === 'expanded' ? '' : 'text-gray-500'}
                    >
                        <ListBulletIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {incidents.map(incident => (
                    <IncidentCard
                        key={incident.id}
                        incident={incident}
                        isExpanded={viewMode === 'expanded' || expandedIncidentId === incident.id}
                        onExpand={() => handleExpand(incident.id)}
                        onChatWithForge={onChatWithForge ? () => onChatWithForge(incident) : undefined}
                        onDismiss={() => onDismiss(incident.id)}
                    />
                ))}
            </div>
        </div>
    );
}
