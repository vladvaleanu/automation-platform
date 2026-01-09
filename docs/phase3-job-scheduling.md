# Phase 3: Job Scheduling System

## Overview

Phase 3 implements a comprehensive job scheduling system with worker pools, event-driven architecture, and full frontend management interfaces. The system enables modules to schedule and execute automated tasks with retry logic, timeout handling, and real-time monitoring.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Job Scheduling System                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐    ┌─────────────┐    ┌──────────────┐    │
│  │   Jobs     │───→│  Job Queue  │───→│    Workers   │    │
│  │ Management │    │  (BullMQ)   │    │     Pool     │    │
│  └────────────┘    └─────────────┘    └──────────────┘    │
│        │                   │                    │           │
│        ↓                   ↓                    ↓           │
│  ┌────────────┐    ┌─────────────┐    ┌──────────────┐    │
│  │ Executions │    │  Event Bus  │    │   Shared     │    │
│  │  History   │    │   (Redis)   │    │  Services    │    │
│  └────────────┘    └─────────────┘    └──────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Job Queue**: BullMQ with Redis
- **Scheduling**: node-cron for cron expression support
- **Event Bus**: Redis pub/sub
- **Worker Pool**: Multiple concurrent workers
- **Frontend**: React with React Query for real-time updates

## Features Implemented

### 1. Job Management

#### Job Creation
- Create jobs with cron schedules or manual execution
- Associate jobs with modules and handlers
- Configure timeout, retries, and custom configuration
- Enable/disable jobs dynamically

#### Job Configuration
```typescript
interface Job {
  id: string;
  name: string;
  description?: string;
  moduleId: string;         // Module that owns this job
  handler: string;           // Path to job handler file
  schedule?: string;         // Cron expression (optional)
  enabled: boolean;          // Job active status
  timeout: number;           // Max execution time (ms)
  retries: number;           // Max retry attempts
  config?: Record<string, any>;  // Job-specific config
}
```

#### Cron Expression Support
Built-in presets for common schedules:
- Every minute: `* * * * *`
- Every 5 minutes: `*/5 * * * *`
- Every 15 minutes: `*/15 * * * *`
- Every 30 minutes: `*/30 * * * *`
- Every hour: `0 * * * *`
- Every 6 hours: `0 */6 * * *`
- Daily at midnight: `0 0 * * *`
- Daily at noon: `0 12 * * *`
- Weekly (Monday 9am): `0 9 * * 1`
- Manual execution: no schedule

### 2. Job Execution

#### Worker Pool
- Multiple concurrent workers process jobs
- Automatic retry with exponential backoff
- Timeout enforcement
- Error handling and logging
- Execution context with shared services

#### Job Context
Each job handler receives a context object:
```typescript
interface JobContext {
  jobId: string;
  executionId: string;
  config: Record<string, any>;
  services: {
    browser: IBrowserService;
    notifications: INotificationService;
    http: IHttpService;
    logger: ILoggerService;
    database: IDatabaseService;
    events: IEventBusService;
  };
}
```

#### Execution Lifecycle
1. **PENDING**: Job queued for execution
2. **RUNNING**: Worker picked up job
3. **COMPLETED**: Job finished successfully
4. **FAILED**: Job failed after retries
5. **TIMEOUT**: Job exceeded timeout
6. **CANCELLED**: Job manually cancelled

### 3. Event Bus System

#### Event-Driven Communication
- Cross-module event publishing and subscription
- Pattern-based subscriptions with wildcards
- Redis pub/sub for scalability
- Event persistence for history and analytics

#### Event Structure
```typescript
interface Event {
  id: string;
  name: string;              // Event identifier (e.g., "user.created")
  source: string;            // Event origin
  payload: Record<string, any>;  // Event data
  createdAt: string;         // Timestamp
}
```

#### Pattern Subscriptions
```typescript
// Subscribe to specific event
eventBus.on('user.created', (event) => {
  console.log('User created:', event.payload);
});

// Subscribe to pattern
eventBus.onPattern('module.*', (event) => {
  console.log('Module event:', event.name);
});

// Emit event
await eventBus.emit('user.created', {
  userId: '123',
  email: 'user@example.com'
}, 'auth-service');
```

### 4. Shared Services Library

#### Browser Service
Headless browser automation with Puppeteer:
```typescript
const browser = await context.services.browser.launch({
  headless: true,
  args: ['--no-sandbox']
});

const page = await browser.newPage();
await page.goto('https://example.com');
const content = await page.content();
await browser.close();
```

#### HTTP Service
HTTP client with retry logic:
```typescript
const response = await context.services.http.get('https://api.example.com/data', {
  headers: { 'Authorization': 'Bearer token' },
  timeout: 10000
});
```

#### Notification Service
Multi-channel notification support:
```typescript
await context.services.notifications.send({
  channel: 'email',
  to: 'user@example.com',
  subject: 'Job Completed',
  body: 'Your job has finished successfully'
});
```

#### Logger Service
Structured logging:
```typescript
context.services.logger.info('Processing item', { itemId: '123' });
context.services.logger.error('Failed to process', { error: err.message });
```

#### Database Service
Direct database access:
```typescript
const users = await context.services.database.query(
  'SELECT * FROM users WHERE active = $1',
  [true]
);
```

### 5. Frontend Management

#### Job Management Interface
- **Jobs Page**: List, filter, and manage all jobs
  - Enable/disable jobs
  - Manual execution
  - View execution history
  - Delete jobs
  - Filter by enabled/disabled status

- **Create Job Page**: Form with cron builder
  - Module and handler selection
  - Cron expression presets
  - Timeout and retry configuration
  - JSON config editor
  - Enable on creation option

#### Execution Monitoring
- **Executions Page**: Real-time execution history
  - Auto-refresh every 5 seconds
  - Filter by status (PENDING, RUNNING, COMPLETED, FAILED, etc.)
  - Pagination support
  - View detailed execution logs

- **Execution Detail Page**: Individual execution viewer
  - Complete execution information
  - Error messages and stack traces
  - Result JSON viewer
  - Full execution logs
  - Auto-refresh for running executions

#### Event Monitoring
- **Events Page**: Event history and analytics
  - Event list with filtering
  - Real-time statistics dashboard
  - Top events and sources
  - Payload viewer
  - Auto-refresh every 10 seconds

## API Endpoints

### Jobs API

```
POST   /api/v1/jobs                  Create new job
GET    /api/v1/jobs                  List all jobs
GET    /api/v1/jobs/:id              Get job details
PUT    /api/v1/jobs/:id              Update job
DELETE /api/v1/jobs/:id              Delete job
PUT    /api/v1/jobs/:id/enable       Enable job
PUT    /api/v1/jobs/:id/disable      Disable job
POST   /api/v1/jobs/:id/execute      Manually execute job
```

### Executions API

```
GET    /api/v1/executions            List executions
GET    /api/v1/executions/:id        Get execution details
DELETE /api/v1/executions/:id        Cancel execution
```

### Events API

```
POST   /api/v1/events                Emit new event
GET    /api/v1/events                List events
GET    /api/v1/events/:id            Get event details
GET    /api/v1/events/recent         Get recent events
GET    /api/v1/events/stats/summary  Get event statistics
DELETE /api/v1/events/cleanup        Cleanup old events
```

## Writing Job Handlers

### Basic Job Handler

```typescript
// jobs/example-job.ts
export default async function handler(context: JobContext) {
  const { logger, config } = context.services;

  logger.info('Starting job execution', { jobId: context.jobId });

  try {
    // Your job logic here
    const data = await fetchData();
    await processData(data);

    logger.info('Job completed successfully');

    return {
      success: true,
      processed: data.length
    };
  } catch (error) {
    logger.error('Job failed', { error: error.message });
    throw error;
  }
}
```

### Job with Browser Automation

```typescript
export default async function handler(context: JobContext) {
  const { browser, logger } = context.services;

  const browserInstance = await browser.launch({ headless: true });

  try {
    const page = await browserInstance.newPage();
    await page.goto('https://example.com');

    // Extract data
    const data = await page.evaluate(() => {
      return document.querySelector('.data').textContent;
    });

    logger.info('Data extracted', { length: data.length });

    return { data };
  } finally {
    await browserInstance.close();
  }
}
```

### Job with Events

```typescript
export default async function handler(context: JobContext) {
  const { events, logger } = context.services;

  // Do some work
  const result = await doWork();

  // Emit event for other modules
  await events.emit('work.completed', {
    jobId: context.jobId,
    result: result
  }, 'worker-module');

  logger.info('Work completed and event emitted');

  return result;
}
```

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Job Configuration
JOB_WORKER_CONCURRENCY=5
JOB_DEFAULT_TIMEOUT=300000
JOB_DEFAULT_RETRIES=3

# Event Configuration
EVENT_RETENTION_DAYS=30
```

### Module Manifest

```json
{
  "name": "my-module",
  "version": "1.0.0",
  "capabilities": {
    "jobs": true
  },
  "jobs": [
    {
      "name": "Data Sync Job",
      "handler": "jobs/sync.js",
      "description": "Syncs data from external API",
      "schedule": "0 * * * *",
      "timeout": 600000,
      "retries": 3
    }
  ]
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- job-execution.test.ts
npm test -- event-bus.test.ts
npm test -- events-api.test.ts

# Run with coverage
npm test -- --coverage
```

### Test Structure

```
packages/backend/src/tests/
├── integration/
│   ├── job-execution.test.ts    # Full job lifecycle tests
│   └── events-api.test.ts       # Event API endpoint tests
└── unit/
    └── event-bus.test.ts        # EventBusService unit tests
```

## Performance Considerations

### Job Queue Optimization
- Use appropriate concurrency settings for your workload
- Monitor Redis memory usage
- Implement job prioritization if needed
- Clean up completed jobs periodically

### Event Bus Optimization
- Use pattern subscriptions wisely (avoid overly broad patterns)
- Clean up old events regularly
- Consider event TTL for high-volume scenarios
- Monitor Redis pub/sub channels

### Worker Pool Management
- Scale workers based on queue length
- Use separate queues for different job types
- Implement circuit breakers for external dependencies
- Monitor worker health and restart failed workers

## Monitoring and Debugging

### Logging
All components use structured logging:
```typescript
logger.info('Job started', {
  jobId: job.id,
  handler: job.handler
});
```

### Metrics
Track key metrics:
- Job queue length
- Execution success/failure rates
- Average execution time
- Event throughput
- Worker utilization

### Debugging Failed Jobs
1. Check execution logs in the frontend
2. Review error messages and stack traces
3. Verify job configuration
4. Test handler function in isolation
5. Check module logs for additional context

## Security Considerations

### Job Execution
- Jobs run with module permissions
- Validate all job configuration
- Sanitize user inputs
- Limit resource usage
- Implement execution timeouts

### Event Bus
- Validate event payloads
- Implement event schemas
- Control event publication permissions
- Monitor for event flooding

## Future Enhancements

### Planned Features
- Job dependencies (job chains)
- Conditional execution rules
- Job result webhooks
- Advanced scheduling (business days, holidays)
- Job templates and cloning
- Distributed job locking
- Job execution priorities
- Rate limiting per module
- Job execution quotas
- Advanced retry strategies (exponential backoff with jitter)

### UI Enhancements
- Job execution graphs/charts
- Real-time execution visualization
- Job configuration wizard
- Cron expression visual builder
- Event flow diagrams
- Performance dashboards

## Troubleshooting

### Common Issues

**Jobs not executing**
- Verify job is enabled
- Check cron expression validity
- Ensure module is enabled
- Review worker logs

**Execution timeouts**
- Increase timeout value
- Optimize job handler logic
- Check external API responsiveness
- Review resource constraints

**Event delivery issues**
- Verify Redis connection
- Check event subscriptions
- Review event patterns
- Monitor Redis pub/sub

**Worker crashes**
- Review error logs
- Check memory usage
- Verify dependencies
- Test handler functions

## Support and Resources

- **API Documentation**: `/docs/api`
- **Example Modules**: `/examples/modules`
- **Issue Tracker**: GitHub Issues
- **Community**: Discord Server

---

**Phase 3 Implementation**: Complete ✓
**Next Phase**: Phase 4 - Advanced Features
