/**
 * Consumption Monitor Module
 * Entry point for the consumption monitoring module
 */

import type { ModuleContext } from '@nxforge/core';

export async function initialize(context: ModuleContext): Promise<void> {
  const { logger } = context.services;

  logger.info('[ConsumptionMonitor] Module initialized');
}

export async function cleanup(context: ModuleContext): Promise<void> {
  const { logger } = context.services;

  logger.info('[ConsumptionMonitor] Module cleaned up');
}
