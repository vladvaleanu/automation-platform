/**
 * Module Route Loader Component
 * Dynamically loads module UI routes using React.lazy()
 */

import React, { Suspense, ComponentType, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { moduleLoaderService } from '../services/module-loader.service';

// Loading fallback component
function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading module...</p>
      </div>
    </div>
  );
}

// Error boundary for module loading errors
class ModuleErrorBoundary extends React.Component<
  { children: React.ReactNode; moduleName: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; moduleName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ModuleLoader] Error loading module ${this.props.moduleName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="max-w-md p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Module Load Error
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">
              Failed to load module: <strong>{this.props.moduleName}</strong>
            </p>
            {this.state.error && (
              <pre className="text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Dynamic Module Component Loader
// ============================================================================

/**
 * Creates a lazy-loaded module component
 * NOTE: This is a placeholder implementation.
 * In a real system, modules would be served from a CDN or bundled separately.
 * For now, this returns a placeholder until we implement actual module loading.
 */
function createModuleComponent(
  moduleName: string,
  componentPath: string
): ComponentType<any> {
  // This is a placeholder that will be replaced with actual dynamic import
  // when modules are properly packaged and served
  return lazy(async () => {
    try {
      // In production, this would fetch the module bundle from:
      // `/modules/${moduleName}/${componentPath}`

      // For now, return a placeholder component
      return {
        default: () => (
          <div className="p-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Module Placeholder
            </h2>
            <p className="text-yellow-700 dark:text-yellow-300">
              Module: <strong>{moduleName}</strong>
            </p>
            <p className="text-yellow-700 dark:text-yellow-300">
              Component: <strong>{componentPath}</strong>
            </p>
            <p className="mt-4 text-sm text-yellow-600 dark:text-yellow-400">
              This is a placeholder. Module components will be dynamically loaded here once
              the module system is fully implemented.
            </p>
          </div>
        ),
      };
    } catch (error) {
      console.error(`Failed to load module ${moduleName} component ${componentPath}:`, error);
      throw error;
    }
  });
}

// ============================================================================
// Module Route Loader Component
// ============================================================================

export function ModuleRouteLoader() {
  const moduleRoutes = moduleLoaderService.getModuleRoutes();

  if (moduleRoutes.length === 0) {
    return null;
  }

  return (
    <Routes>
      {moduleRoutes.map((route) => {
        const Component = createModuleComponent(route.moduleName, route.component);

        return (
          <Route
            key={`${route.moduleName}-${route.path}`}
            path={route.path}
            element={
              <ModuleErrorBoundary moduleName={route.moduleName}>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Component />
                </Suspense>
              </ModuleErrorBoundary>
            }
          />
        );
      })}
    </Routes>
  );
}

export default ModuleRouteLoader;
