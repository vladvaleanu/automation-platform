/**
 * Alert Rule Service
 * Manages alert rules and evaluates events against them
 * Phase 5.1: Extended with OR logic, time windows, rate limiting, escalation
 */

import type { Logger } from 'pino';
import type { PrismaClient, AlertRule as PrismaAlertRule } from '@prisma/client';
import type {
    AlertRule,
    AlertRuleRequest,
    AlertCondition,
    AlertConditionOperator,
    RuleEvaluationEvent,
    ConditionLogic,
} from '../types/alert.types.js';

/**
 * AlertRuleService - CRUD and evaluation of alert rules
 */
export class AlertRuleService {
    private prisma: PrismaClient;
    private logger: Logger;

    constructor(prisma: PrismaClient, logger: Logger) {
        this.prisma = prisma;
        this.logger = logger.child({ service: 'alert-rules' });
    }

    /**
     * Get all alert rules
     */
    async getAllRules(): Promise<AlertRule[]> {
        const rules = await this.prisma.alertRule.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return rules.map(this.mapPrismaToRule);
    }

    /**
     * Get enabled rules only
     */
    async getEnabledRules(): Promise<AlertRule[]> {
        const rules = await this.prisma.alertRule.findMany({
            where: { enabled: true },
            orderBy: { createdAt: 'desc' }
        });
        return rules.map(this.mapPrismaToRule);
    }

    /**
     * Get rule by ID
     */
    async getRuleById(id: string): Promise<AlertRule | null> {
        const rule = await this.prisma.alertRule.findUnique({
            where: { id }
        });
        if (!rule) return null;
        return this.mapPrismaToRule(rule);
    }

    /**
     * Create a new alert rule
     */
    async createRule(request: AlertRuleRequest): Promise<AlertRule> {
        const timeWindowDays = request.timeWindowDays || [1, 2, 3, 4, 5, 6, 7];

        const rule = await this.prisma.alertRule.create({
            data: {
                name: request.name,
                description: request.description,
                enabled: request.enabled ?? true,
                source: request.source,
                eventType: request.eventType,
                conditions: request.conditions as any, // Json type
                conditionLogic: request.conditionLogic || 'AND',
                severity: request.severity,
                messageTemplate: request.messageTemplate,
                labels: (request.labels || {}) as any,
                cooldownSeconds: request.cooldownSeconds ?? 60,
                // Time Window
                timeWindowEnabled: request.timeWindowEnabled ?? false,
                timeWindowStart: request.timeWindowStart,
                timeWindowEnd: request.timeWindowEnd,
                timeWindowDays: timeWindowDays,
                // Rate Limiting
                rateLimitEnabled: request.rateLimitEnabled ?? false,
                rateLimitCount: request.rateLimitCount ?? 5,
                rateLimitWindowSeconds: request.rateLimitWindowSeconds ?? 300,
                // Escalation
                escalationEnabled: request.escalationEnabled ?? false,
                escalationAfterMinutes: request.escalationAfterMinutes ?? 30,
                escalationToSeverity: request.escalationToSeverity || 'critical',
            }
        });

        this.logger.info({ ruleId: rule.id, name: rule.name }, 'Created alert rule');
        return this.mapPrismaToRule(rule);
    }

    /**
     * Update an existing alert rule
     */
    async updateRule(id: string, request: Partial<AlertRuleRequest>): Promise<AlertRule | null> {
        try {
            const updateData: any = {};
            if (request.name !== undefined) updateData.name = request.name;
            if (request.description !== undefined) updateData.description = request.description;
            if (request.enabled !== undefined) updateData.enabled = request.enabled;
            if (request.source !== undefined) updateData.source = request.source;
            if (request.eventType !== undefined) updateData.eventType = request.eventType;
            if (request.conditions !== undefined) updateData.conditions = request.conditions;
            if (request.conditionLogic !== undefined) updateData.conditionLogic = request.conditionLogic;
            if (request.severity !== undefined) updateData.severity = request.severity;
            if (request.messageTemplate !== undefined) updateData.messageTemplate = request.messageTemplate;
            if (request.labels !== undefined) updateData.labels = request.labels;
            if (request.cooldownSeconds !== undefined) updateData.cooldownSeconds = request.cooldownSeconds;

            // Time Window
            if (request.timeWindowEnabled !== undefined) updateData.timeWindowEnabled = request.timeWindowEnabled;
            if (request.timeWindowStart !== undefined) updateData.timeWindowStart = request.timeWindowStart;
            if (request.timeWindowEnd !== undefined) updateData.timeWindowEnd = request.timeWindowEnd;
            if (request.timeWindowDays !== undefined) updateData.timeWindowDays = request.timeWindowDays;

            // Rate Limit
            if (request.rateLimitEnabled !== undefined) updateData.rateLimitEnabled = request.rateLimitEnabled;
            if (request.rateLimitCount !== undefined) updateData.rateLimitCount = request.rateLimitCount;
            if (request.rateLimitWindowSeconds !== undefined) updateData.rateLimitWindowSeconds = request.rateLimitWindowSeconds;

            // Escalation
            if (request.escalationEnabled !== undefined) updateData.escalationEnabled = request.escalationEnabled;
            if (request.escalationAfterMinutes !== undefined) updateData.escalationAfterMinutes = request.escalationAfterMinutes;
            if (request.escalationToSeverity !== undefined) updateData.escalationToSeverity = request.escalationToSeverity;

            const rule = await this.prisma.alertRule.update({
                where: { id },
                data: updateData
            });

            this.logger.info({ ruleId: id }, 'Updated alert rule');
            return this.mapPrismaToRule(rule);
        } catch (error) {
            this.logger.error({ error, ruleId: id }, 'Failed to update rule');
            return null;
        }
    }

    /**
     * Delete an alert rule
     */
    async deleteRule(id: string): Promise<boolean> {
        try {
            await this.prisma.alertRule.delete({
                where: { id }
            });
            this.logger.info({ ruleId: id }, 'Deleted alert rule');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Toggle rule enabled status
     */
    async toggleRule(id: string, enabled: boolean): Promise<AlertRule | null> {
        try {
            const rule = await this.prisma.alertRule.update({
                where: { id },
                data: { enabled }
            });
            return this.mapPrismaToRule(rule);
        } catch (error) {
            return null;
        }
    }

    /**
     * Evaluate an event against all enabled rules
     * Returns list of rules that match
     */
    async evaluateEvent(event: RuleEvaluationEvent): Promise<AlertRule[]> {
        const rules = await this.getEnabledRules();
        const matchingRules: AlertRule[] = [];

        for (const rule of rules) {
            // Check time window first
            if (rule.timeWindow.enabled && !this.isInTimeWindow(rule)) {
                this.logger.debug({ ruleId: rule.id }, 'Rule outside time window, skipping');
                continue;
            }

            // Check rate limit
            if (rule.rateLimit.enabled && !(await this.checkRateLimit(rule))) {
                this.logger.debug({ ruleId: rule.id }, 'Rule rate limited, skipping');
                continue;
            }

            if (this.eventMatchesRule(event, rule)) {
                // Check cooldown
                if (rule.lastTriggeredAt) {
                    const cooldownEnd = new Date(rule.lastTriggeredAt.getTime() + rule.cooldownSeconds * 1000);
                    if (new Date() < cooldownEnd) {
                        this.logger.debug({ ruleId: rule.id }, 'Rule in cooldown, skipping');
                        continue;
                    }
                }

                matchingRules.push(rule);

                // Update last triggered time and rate limit counter
                await this.recordTrigger(rule);
            }
        }

        return matchingRules;
    }

    /**
     * Record rule trigger (update lastTriggeredAt and rate limit counters)
     */
    private async recordTrigger(rule: AlertRule): Promise<void> {
        // Logic to update rate limit counters
        // Need to fetch current rule state first to do atomic-like check or just update blindly if using SQL, but with Prisma we need logic.
        // Actually, for rate limiting logic implemented in SQL previously:
        /*
           CASE 
             WHEN rate_limit_window_start IS NULL OR rate_limit_window_start < NOW() - window THEN 1 
             ELSE current + 1 
           END
        */
        // Use raw query for atomic update or read-update-write
        // Read-update-write is race-prone but simpler. Let's use Prisma update with exact logic if possible or just fetch-update.
        // Given this is an agent, let's stick to readable fetch-update for now, or use raw for performance/correctness.
        // I'll implement fetch-update.

        const currentRule = await this.prisma.alertRule.findUnique({ where: { id: rule.id } });
        if (!currentRule) return;

        const now = new Date();
        const windowSeconds = currentRule.rateLimitWindowSeconds;
        let newCount = currentRule.rateLimitCurrentCount + 1;
        let newWindowStart = currentRule.rateLimitWindowStart;

        if (!currentRule.rateLimitWindowStart || (now.getTime() - currentRule.rateLimitWindowStart.getTime() > windowSeconds * 1000)) {
            newCount = 1;
            newWindowStart = now;
        }

        await this.prisma.alertRule.update({
            where: { id: rule.id },
            data: {
                lastTriggeredAt: now,
                rateLimitCurrentCount: newCount,
                rateLimitWindowStart: newWindowStart
            }
        });
    }

    /**
     * Check if current time is within rule's time window
     */
    private isInTimeWindow(rule: AlertRule): boolean {
        const now = new Date();

        // Check day of week (1=Mon, 7=Sun in our system, JS uses 0=Sun, 1=Mon)
        const currentDay = now.getDay() === 0 ? 7 : now.getDay();
        if (!rule.timeWindow.days.includes(currentDay)) {
            return false;
        }

        // Check time range
        if (rule.timeWindow.start && rule.timeWindow.end) {
            const currentTime = now.toTimeString().slice(0, 5); // HH:MM
            const start = rule.timeWindow.start;
            const end = rule.timeWindow.end;

            // Handle cases where end is after midnight
            if (start <= end) {
                return currentTime >= start && currentTime <= end;
            } else {
                // Overnight window (e.g., 22:00 - 06:00)
                return currentTime >= start || currentTime <= end;
            }
        }

        return true;
    }

    /**
     * Check if rule has exceeded rate limit
     */
    private async checkRateLimit(rule: AlertRule): Promise<boolean> {
        const currentRule = await this.prisma.alertRule.findUnique({
            where: { id: rule.id },
            select: { rateLimitCurrentCount: true, rateLimitWindowStart: true }
        });

        if (!currentRule) return true;

        const { rateLimitCurrentCount, rateLimitWindowStart } = currentRule;

        if (!rateLimitWindowStart) return true;

        const windowStart = new Date(rateLimitWindowStart);
        const windowEnd = new Date(windowStart.getTime() + rule.rateLimit.windowSeconds * 1000);

        // If we're past the window, reset is allowed
        if (new Date() > windowEnd) return true;

        // Check if we've exceeded the limit
        return rateLimitCurrentCount < rule.rateLimit.count;
    }

    /**
     * Check if an event matches a rule
     */
    private eventMatchesRule(event: RuleEvaluationEvent, rule: AlertRule): boolean {
        // Check source filter
        if (rule.source !== '*' && rule.source !== event.source) {
            return false;
        }

        // Check event type filter
        if (rule.eventType !== '*' && rule.eventType !== event.type) {
            return false;
        }

        // No conditions = always match
        if (rule.conditions.length === 0) {
            return true;
        }

        // Evaluate conditions based on logic type
        if (rule.conditionLogic === 'OR') {
            // OR logic: any condition matches
            for (const condition of rule.conditions) {
                if (this.evaluateCondition(event.payload, condition)) {
                    return true;
                }
            }
            return false;
        } else {
            // AND logic (default): all conditions must match
            for (const condition of rule.conditions) {
                if (!this.evaluateCondition(event.payload, condition)) {
                    return false;
                }
            }
            return true;
        }
    }

    /**
     * Evaluate a single condition against event payload
     */
    private evaluateCondition(payload: Record<string, any>, condition: AlertCondition): boolean {
        const value = this.getNestedValue(payload, condition.field);

        if (value === undefined) {
            return false;
        }

        // Need to ensure condition adheres to interface
        return this.compareValues(value, condition.operator, condition.value);
    }

    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue(obj: Record<string, any>, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Compare values using operator
     */
    private compareValues(actual: any, operator: AlertConditionOperator, expected: string | number): boolean {
        switch (operator) {
            case 'eq':
                return actual == expected;
            case 'ne':
                return actual != expected;
            case 'gt':
                return Number(actual) > Number(expected);
            case 'lt':
                return Number(actual) < Number(expected);
            case 'gte':
                return Number(actual) >= Number(expected);
            case 'lte':
                return Number(actual) <= Number(expected);
            case 'contains':
                return String(actual).toLowerCase().includes(String(expected).toLowerCase());
            case 'not_contains':
                return !String(actual).toLowerCase().includes(String(expected).toLowerCase());
            default:
                return false;
        }
    }

    /**
     * Build alert message from template
     */
    buildAlertMessage(rule: AlertRule, event: RuleEvaluationEvent): string {
        if (!rule.messageTemplate) {
            return `Alert: ${rule.name} triggered by ${event.source}`;
        }

        return rule.messageTemplate.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
            const value = this.getNestedValue(event.payload, path);
            return value !== undefined ? String(value) : `{{${path}}}`;
        });
    }

    /**
     * Map Prisma rule to internal AlertRule type
     */
    private mapPrismaToRule(row: any): AlertRule {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            enabled: row.enabled,
            source: row.source,
            eventType: row.eventType,
            conditions: (row.conditions as unknown as AlertCondition[]) || [],
            conditionLogic: (row.conditionLogic || 'AND') as ConditionLogic,
            severity: row.severity,
            messageTemplate: row.messageTemplate,
            labels: (row.labels as Record<string, string>) || {},
            cooldownSeconds: row.cooldownSeconds,
            lastTriggeredAt: row.lastTriggeredAt,
            timeWindow: {
                enabled: row.timeWindowEnabled || false,
                start: row.timeWindowStart || undefined,
                end: row.timeWindowEnd || undefined,
                days: row.timeWindowDays || [1, 2, 3, 4, 5, 6, 7],
            },
            rateLimit: {
                enabled: row.rateLimitEnabled || false,
                count: row.rateLimitCount || 5,
                windowSeconds: row.rateLimitWindowSeconds || 300,
            },
            escalation: {
                enabled: row.escalationEnabled || false,
                afterMinutes: row.escalationAfterMinutes || 30,
                toSeverity: row.escalationToSeverity || 'critical',
            },
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
