/**
 * Contribution Routes
 * Endpoints for fetching module contributions (widgets, navigation, etc.)
 */

import { FastifyPluginAsync } from 'fastify';
import { ModuleLoaderService } from '../services/module-loader.service.js';

export const contributionsRoutes: FastifyPluginAsync = async (fastify) => {
    // Get all dashboard widgets from enabled modules
    fastify.get('/dashboard/widgets', async (_request, reply) => {
        // Get all loaded modules
        const loadedModules = Array.from(ModuleLoaderService.getLoadedModules().values());

        // Filter for enabled modules even though loaded modules should be enabled
        // and extract widget contributions
        const widgets: any[] = [];

        for (const module of loadedModules) {
            const contributions = module.manifest.contributions;
            if (contributions?.dashboard?.widgets) {
                // Enhance widgets with module context
                const moduleWidgets = contributions.dashboard.widgets.map(w => ({
                    ...w,
                    moduleName: module.manifest.name,
                    // Ensure component path is complete or usable by frontend
                    // For now we pass it as is, frontend will need to resolve it
                }));
                widgets.push(...moduleWidgets);
            }
        }

        // Sort by order if present
        widgets.sort((a, b) => (a.order || 999) - (b.order || 999));

        return reply.send({
            success: true,
            data: widgets
        });
    });

    // Get navigation structure from enabled modules
    fastify.get('/navigation/structure', async (_request, reply) => {
        const loadedModules = Array.from(ModuleLoaderService.getLoadedModules().values());

        // Default categories
        const structure: Record<string, any[]> = {
            monitoring: [],
            operations: [],
            tools: [],
            settings: []
        };

        const uncategorized: any[] = [];



        for (const module of loadedModules) {
            const nav = module.manifest.contributions?.navigation;

            if (nav && nav.category && structure[nav.category]) {
                if (nav.items && Array.isArray(nav.items)) {
                    // Support multiple items per module
                    nav.items.forEach((item: any) => {
                        structure[nav.category].push({
                            label: item.label,
                            path: item.path,
                            icon: item.icon,
                            moduleName: module.manifest.name,
                            order: item.order || nav.order // Item order or category-level order
                        });
                    });
                } else {
                    // Fallback for single item structure (if any legacy modules use it)
                    const navItem = {
                        label: nav.label || module.manifest.displayName || module.manifest.name,
                        path: nav.path || `/modules/${module.manifest.name}`,
                        icon: nav.icon,
                        moduleName: module.manifest.name,
                        order: nav.order
                    };
                    structure[nav.category].push(navItem);
                }
            } else {
                // Legacy fallback: modules without specific category go to "uncategorized"
                const navItem = {
                    label: module.manifest.displayName || module.manifest.name,
                    path: `/modules/${module.manifest.name}`,
                    icon: undefined,
                    moduleName: module.manifest.name,
                    order: undefined
                };
                uncategorized.push(navItem);
            }
        }

        // Sort items within categories
        for (const category in structure) {
            structure[category].sort((a, b) => (a.order || 999) - (b.order || 999));
        }

        return reply.send({
            success: true,
            data: {
                categories: structure,
                uncategorized
            }
        });
    });
};
