import React, { Suspense, useEffect, useState } from 'react';

interface DynamicWidgetProps {
    moduleName: string;
    componentPath: string;
    title: string;
    refreshInterval?: number;
    className?: string;
}

// Widget Registry to map module/component strings to actual imports
// In a full implementation, this might be generated or use import.meta.glob
const WIDGET_REGISTRY: Record<string, React.LazyExoticComponent<any>> = {
    // Mapping format: "moduleName/componentPath" -> lazy import
    // The componentPath comes from manifest, e.g., "./components/LivePowerWidget"
    // We normalize it to just the component name for simplicity in this registry
    "consumption-monitor/LivePowerWidget": React.lazy(() => import('@modules/consumption-monitor/src/components/LivePowerWidget')),
};

const DynamicWidget: React.FC<DynamicWidgetProps> = ({
    moduleName,
    componentPath,
    title,
    refreshInterval,
    className
}) => {
    const [Component, setComponent] = useState<React.LazyExoticComponent<any> | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadComponent = async () => {
            setError(null);
            try {
                // Normalize path to key: remove './components/' prefix if present
                // e.g. "./components/LivePowerWidget" -> "LivePowerWidget"
                const cleanName = componentPath.replace(/^\.\/components\//, '').replace(/^\.\//, '');
                const registryKey = `${moduleName}/${cleanName}`;

                const WidgetComponent = WIDGET_REGISTRY[registryKey];

                if (WidgetComponent) {
                    setComponent(WidgetComponent);
                } else {
                    // Fallback for demo purposes or unknown widgets
                    if (moduleName === 'consumption-monitor' && title === 'Live Power Usage') {
                        const Fallback = React.lazy(() => import('@modules/consumption-monitor/src/components/LivePowerWidget'));
                        setComponent(Fallback);
                    } else {
                        throw new Error(`Widget component not found in registry: ${registryKey}`);
                    }
                }
            } catch (err: any) {
                console.error(`Failed to load widget ${moduleName}/${title}:`, err);
                setError(`Failed to load widget: ${err.message}`);
            }
        };

        loadComponent();
    }, [moduleName, componentPath, title]);

    if (error) {
        return (
            <div className={`p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg ${className}`}>
                <div className="text-red-800 dark:text-red-200 text-sm font-medium">Error loading {title}</div>
                <div className="text-red-600 dark:text-red-400 text-xs mt-1">{error}</div>
            </div>
        );
    }

    if (!Component) {
        return (
            <div className={`p-4 ${className} min-h-[150px] animate-pulse bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700`}>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-4/6"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 ${className} h-full flex flex-col`}>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{title}</h3>
                {refreshInterval && (
                    <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        {refreshInterval / 1000}s
                    </span>
                )}
            </div>
            <div className="p-4 flex-1 flex flex-col justify-center">
                <Suspense fallback={
                    <div className="animate-pulse space-y-3">
                        <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                    </div>
                }>
                    <Component />
                </Suspense>
            </div>
        </div>
    );
};

export default DynamicWidget;
