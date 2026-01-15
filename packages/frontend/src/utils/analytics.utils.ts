/**
 * Analytics Tracking Utilities
 * Simple event and error tracking without external dependencies
 */

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  statusCode?: number;
  endpoint?: string;
  component?: string;
  metadata?: Record<string, any>;
}

/**
 * Track a user interaction event
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (import.meta.env.DEV) {
    console.log('[Analytics] Event:', event);
  }

  // In production, you would send to your analytics service
  // Example: window.gtag?.('event', event.action, { ... });
  // Example: window.analytics?.track(event.action, { ... });

  // Store in localStorage for now (development/demo purposes)
  try {
    const events = getStoredEvents();
    events.push({
      ...event,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 events
    if (events.length > 100) {
      events.shift();
    }

    localStorage.setItem('analytics_events', JSON.stringify(events));
  } catch (error) {
    // Silent fail - don't break app if analytics fails
    console.error('Failed to store analytics event:', error);
  }
}

/**
 * Track an error occurrence
 */
export function trackError(error: ErrorEvent): void {
  if (import.meta.env.DEV) {
    console.error('[Analytics] Error:', error);
  }

  // In production, you would send to error tracking service
  // Example: Sentry.captureException(error);
  // Example: window.bugsnag?.notify(error);

  // Store in localStorage for now
  try {
    const errors = getStoredErrors();
    errors.push({
      ...error,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.shift();
    }

    localStorage.setItem('analytics_errors', JSON.stringify(errors));
  } catch (storageError) {
    console.error('Failed to store error:', storageError);
  }
}

/**
 * Track page view
 */
export function trackPageView(page: string, title?: string): void {
  trackEvent({
    category: 'Navigation',
    action: 'Page View',
    label: page,
    metadata: {
      title: title || document.title,
      referrer: document.referrer,
    },
  });
}

/**
 * Get stored events (for debugging/reporting)
 */
export function getStoredEvents(): any[] {
  try {
    const stored = localStorage.getItem('analytics_events');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get stored errors (for debugging/reporting)
 */
export function getStoredErrors(): any[] {
  try {
    const stored = localStorage.getItem('analytics_errors');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Clear all stored analytics data
 */
export function clearAnalyticsData(): void {
  localStorage.removeItem('analytics_events');
  localStorage.removeItem('analytics_errors');
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary(): {
  totalEvents: number;
  totalErrors: number;
  recentEvents: any[];
  recentErrors: any[];
  errorRate: number;
} {
  const events = getStoredEvents();
  const errors = getStoredErrors();

  return {
    totalEvents: events.length,
    totalErrors: errors.length,
    recentEvents: events.slice(-10),
    recentErrors: errors.slice(-10),
    errorRate: events.length > 0 ? (errors.length / events.length) * 100 : 0,
  };
}

// Common event tracking helpers

export const Analytics = {
  // User interactions
  buttonClick: (label: string, metadata?: Record<string, any>) => {
    trackEvent({
      category: 'User Interaction',
      action: 'Button Click',
      label,
      metadata,
    });
  },

  formSubmit: (formName: string, success: boolean, metadata?: Record<string, any>) => {
    trackEvent({
      category: 'Form',
      action: success ? 'Submit Success' : 'Submit Failed',
      label: formName,
      metadata,
    });
  },

  linkClick: (url: string, external: boolean = false) => {
    trackEvent({
      category: 'Navigation',
      action: external ? 'External Link' : 'Internal Link',
      label: url,
    });
  },

  // Module actions
  moduleEnabled: (moduleName: string) => {
    trackEvent({
      category: 'Module',
      action: 'Enable',
      label: moduleName,
    });
  },

  moduleDisabled: (moduleName: string) => {
    trackEvent({
      category: 'Module',
      action: 'Disable',
      label: moduleName,
    });
  },

  // Job actions
  jobCreated: (jobName: string) => {
    trackEvent({
      category: 'Job',
      action: 'Create',
      label: jobName,
    });
  },

  jobExecuted: (jobName: string) => {
    trackEvent({
      category: 'Job',
      action: 'Execute',
      label: jobName,
    });
  },

  jobDeleted: (jobName: string) => {
    trackEvent({
      category: 'Job',
      action: 'Delete',
      label: jobName,
    });
  },

  // Authentication
  loginSuccess: (method?: string) => {
    trackEvent({
      category: 'Authentication',
      action: 'Login Success',
      label: method,
    });
  },

  loginFailed: (reason?: string) => {
    trackEvent({
      category: 'Authentication',
      action: 'Login Failed',
      label: reason,
    });
  },

  logout: () => {
    trackEvent({
      category: 'Authentication',
      action: 'Logout',
    });
  },

  // Errors
  apiError: (endpoint: string, statusCode: number, message: string) => {
    trackError({
      message,
      statusCode,
      endpoint,
      component: 'API',
    });
  },

  componentError: (component: string, error: Error) => {
    trackError({
      message: error.message,
      stack: error.stack,
      component,
    });
  },
};
