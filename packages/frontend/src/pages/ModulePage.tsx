import React, { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import DynamicWidget from '../components/dashboard/DynamicWidget';

// A registry of module main pages if they exist
// Similar to widget registry, but for full pages
const MODULE_PAGE_REGISTRY: Record<string, React.LazyExoticComponent<any>> = {
    'documentation-manager': React.lazy(() => import('../modules/documentation-manager/pages/DocumentationPage')),
};

export default function ModulePage() {
    const { moduleName } = useParams<{ moduleName: string }>();

    // Check if we have a registered page for this module
    const ModuleComponent = moduleName ? MODULE_PAGE_REGISTRY[moduleName] : null;

    if (ModuleComponent) {
        return (
            <Suspense fallback={<div className="p-8">Loading module...</div>}>
                <ModuleComponent />
            </Suspense>
        );
    }

    // Fallback: Show a default dashboard style page for modules that only provide widgets
    // or a "Construction" page

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white capitalize">
                    {moduleName?.replace('-', ' ')}
                </h1>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {moduleName?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Module Active
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        The {moduleName} module is running.
                    </p>

                    {/* If it's consumption-monitor, let's show the widget here too as a demo */}
                    {moduleName === 'consumption-monitor' && (
                        <div className="mt-8 mx-auto max-w-sm h-64">
                            <DynamicWidget
                                moduleName="consumption-monitor"
                                componentPath="./components/LivePowerWidget"
                                title="Live Power Usage"
                                refreshInterval={5000}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
