/**
 * Live Power Widget for Dashboard
 * Displays real-time power consumption summary
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap, AlertCircle } from 'lucide-react';

interface LiveDashboardData {
    endpoints: Array<{
        id: string;
        name: string;
        lastReading?: {
            power?: number;
            totalKwh?: number;
        };
        status: 'online' | 'offline' | 'error';
    }>;
    summary: {
        totalEndpoints: number;
        activeEndpoints: number;
        totalKwh: number;
    };
}

const LivePowerWidget: React.FC = () => {
    const { data, isLoading, error } = useQuery<LiveDashboardData>({
        queryKey: ['consumption-live-widget'],
        queryFn: async (): Promise<LiveDashboardData> => {
            const response = await fetch('/api/v1/m/consumption-monitor/live');
            if (!response.ok) throw new Error('Failed to fetch live data');
            const result = await response.json() as { data: LiveDashboardData };
            return result.data;
        },
        refetchInterval: 5000, // Refresh every 5 seconds
        staleTime: 4000,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-4 animate-pulse">
                <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-4 text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-8 h-8 mb-2 text-amber-500" />
                <span className="text-sm">No data available</span>
            </div>
        );
    }

    // Calculate total current power from all online endpoints
    const totalPower = data.endpoints
        .filter(e => e.status === 'online' && e.lastReading?.power)
        .reduce((sum, e) => sum + (e.lastReading?.power || 0), 0);

    const onlineCount = data.summary.activeEndpoints;
    const totalCount = data.summary.totalEndpoints;

    // Determine color based on power level (green < 500W, yellow < 1000W, red >= 1000W)
    const powerColor = totalPower < 500
        ? 'text-green-600 dark:text-green-400'
        : totalPower < 1000
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400';

    const barColor = totalPower < 500
        ? 'bg-green-500'
        : totalPower < 1000
            ? 'bg-amber-500'
            : 'bg-red-500';

    // Calculate bar percentage (normalize to 2000W max for display)
    const barPercent = Math.min((totalPower / 2000) * 100, 100);

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="flex items-center gap-2 mb-1">
                <Zap className={`w-5 h-5 ${powerColor}`} />
                <span className={`text-3xl font-bold ${powerColor}`}>
                    {totalPower >= 1000
                        ? `${(totalPower / 1000).toFixed(1)} kW`
                        : `${Math.round(totalPower)} W`}
                </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Current Power Draw
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} transition-all duration-500`}
                    style={{ width: `${barPercent}%` }}
                />
            </div>
            <div className="flex justify-between w-full mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{onlineCount}/{totalCount} online</span>
                <span>{data.summary.totalKwh.toFixed(1)} kWh total</span>
            </div>
        </div>
    );
};

export default LivePowerWidget;

