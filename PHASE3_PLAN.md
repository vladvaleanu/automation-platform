# Phase 3: Automation Runtime - Implementation Plan

**Status**: 🚀 Ready to Start
**Prerequisites**: ✅ Phase 2 Complete

## 📋 Overview

Phase 3 builds the automation runtime that provides core infrastructure services for modules. The platform acts as a **hub for automation modules**, with all business logic contained in modules and the core providing only infrastructure.

**Architecture Philosophy**: Keep core clean - modules contain all business logic and use shared services from core.

## 🎯 Objectives

1. **Job Scheduler** - Job queue (BullMQ), cron scheduling, job execution tracking
2. **Worker Pool** - Process isolation for running jobs, resource management
3. **Event Bus** - Cross-module communication, event pub/sub
4. **Shared Services Library** - Browser automation (Playwright), notifications (email, SMS, webhooks), database helpers, HTTP client utilities, logging utilities
5. **Job Monitoring UI** - Track job execution, logs, and history with management interface

## 🏗️ Architecture Components

### 1. Job Scheduling System

**Technology**: BullMQ (Redis-based job queue)

**Components**:
- Job Queue Management
- Cron-based Scheduling
- Priority Queues
- Job Retry Logic
- Dead Letter Queue

**Database Tables**:
- `Job` - Job definitions and configurations
- `JobExecution` - Execution history and logs
- `JobSchedule` - Cron schedules

### 2. Worker Pool

**Components**:
- Worker Manager
- Job Executor
- Resource Limits
- Concurrency Control
- Health Monitoring

**Features**:
- Isolated execution per job
- Timeout handling
- Error recovery
- Resource cleanup

### 3. Shared Services Library

**Purpose**: Core infrastructure services that modules can use

**Services**:

**BrowserService** (Playwright + Docker/Podman)
- Browser session management with pooling
- Container sandboxing for security
- Screenshot & PDF generation
- Network request interception
- Cookie and storage management
- Resource limits per container

**NotificationService**
- Email notifications (SMTP)
- SMS notifications (Twilio/AWS SNS)
- Webhook dispatching
- Notification templates
- Delivery tracking

**HttpService**
- HTTP client with retry logic
- Request/response logging
- Timeout management
- Error handling

**LoggerService**
- Structured logging (JSON format)
- Log levels (debug, info, warn, error)
- Module context tracking
- Log persistence

**DatabaseService**
- Query helpers
- Transaction management
- Connection pooling

### 4. Event System

**Technology**: Redis Pub/Sub

**Components**:
- Event Bus Service
- Event Registry & Schema Validation
- Event Listeners
- Event History

**Features**:
- Module-to-module communication
- Event subscriptions with schema validation
- Event replay
- Event filtering
- Cross-worker event distribution

## 📅 Implementation Steps

Implementation will follow a logical dependency order. Each component builds on the previous ones.

### Step 1: Core Infrastructure
**Database Schema & Types**
- Create Job, JobExecution, JobSchedule, Event tables
- Define TypeScript types for all entities
- Create Prisma migrations
- Seed example data

**Dependencies to Install**
- BullMQ + IORedis for job queue
- Playwright for browser automation
- Cron-parser for schedule parsing
- Additional utilities

### Step 2: Job Scheduling System
**BullMQ Integration**
- Install and configure BullMQ with Redis
- Create JobQueueService for queue management
- Implement queue monitoring and metrics
- Set up dead letter queue for failed jobs

**Job Scheduler Service**
- Create JobSchedulerService for cron scheduling
- Implement schedule parsing and validation
- Add job creation, update, delete APIs
- Build schedule calculation (next run times)

**Job Management APIs**
- POST /api/v1/jobs - Create job
- GET /api/v1/jobs - List jobs with filters
- GET /api/v1/jobs/:id - Get job details
- PUT /api/v1/jobs/:id - Update job
- DELETE /api/v1/jobs/:id - Delete job
- POST /api/v1/jobs/:id/execute - Manual trigger
- PUT /api/v1/jobs/:id/enable - Enable job
- PUT /api/v1/jobs/:id/disable - Disable job

### Step 3: Worker Pool & Job Execution
**Worker Service**
- Create WorkerService for job processing
- Implement worker pool with concurrency control
- Add process isolation for job execution
- Resource limits (CPU, memory, time)
- Health monitoring for workers

**Job Executor**
- Dynamic job handler loading from modules
- Timeout and retry logic
- Error handling and recovery
- Execution logging and result storage
- Cleanup after job completion

**Execution APIs**
- GET /api/v1/jobs/:id/executions - List executions
- GET /api/v1/executions/:id - Get execution details
- GET /api/v1/executions/:id/logs - Stream logs
- DELETE /api/v1/executions/:id - Delete execution

### Step 4: Shared Services Library
**Core Services Implementation**

Create infrastructure services that modules can use:

**BrowserService** (`services/browser.service.ts`)
- Install Playwright with browsers
- Browser session pooling
- Container sandboxing (Docker/Podman)
- Screenshot & PDF generation
- Network request interception
- Resource limits per container

**NotificationService** (`services/notification.service.ts`)
- Email notifications (SMTP/Nodemailer)
- SMS notifications (Twilio/AWS SNS)
- Webhook dispatching
- Template rendering
- Delivery tracking

**HttpService** (`services/http.service.ts`)
- HTTP client wrapper (axios/fetch)
- Retry logic with exponential backoff
- Request/response logging
- Timeout management

**LoggerService** (`services/logger.service.ts`)
- Structured logging (Pino)
- Module context tracking
- Log persistence to database
- Log level filtering

**DatabaseService** (`services/database.service.ts`)
- Query helpers for common operations
- Transaction management
- Connection pooling (Prisma)

### Step 5: Event System
**Event Bus Service**
- Create EventBusService using Redis Pub/Sub
- Implement event schema validation
- Event registry for module events
- Subscription management

**Module Integration**
- Connect modules to event bus on enable
- Event listener registration from manifest
- Event emitter helpers for modules
- Cross-worker event distribution

**Event APIs**
- GET /api/v1/events - List events with filters
- GET /api/v1/events/:name - Get events by name
- POST /api/v1/events - Publish event (internal)
- GET /api/v1/events/:name/schema - Get event schema

### Step 6: Frontend Components
**Jobs Management UI**
- JobsPage - List all jobs with status
- JobForm - Create/edit job modal
- JobDetails - View job configuration
- ScheduleBuilder - Visual cron expression builder
- JobExecutionList - Execution history

**Monitoring UI**
- ExecutionLogs - Real-time log viewer
- ExecutionDetails - Execution results and errors
- EventStream - Live event viewer
- EventHistory - Historical events with filtering
- SystemHealth - Worker and queue metrics

**Real-time Updates**
- WebSocket connection for live updates
- Job status changes
- Execution progress
- Event notifications

### Step 7: Testing & Documentation
**Automated Tests**
- Unit tests for all services
- Integration tests for job execution
- End-to-end tests with browser automation
- Performance tests for job queue

**Documentation**
- Job handler development guide
- Browser automation examples
- Event system guide
- API reference documentation
- Operator manual for UI

## 📊 Detailed Implementation Steps

### Step 1: Database Schema

**New Tables**:

```prisma
model Job {
  id          String   @id @default(uuid())
  name        String
  description String?
  moduleId    String
  module      Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  handler     String   // Path to handler function
  schedule    String?  // Cron expression
  enabled     Boolean  @default(true)
  timeout     Int      @default(300000) // 5 minutes
  retries     Int      @default(3)
  config      Json?    // Job-specific configuration
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  executions  JobExecution[]
  schedules   JobSchedule[]

  @@index([moduleId])
  @@index([enabled])
}

model JobExecution {
  id          String   @id @default(uuid())
  jobId       String
  job         Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  status      JobExecutionStatus
  startedAt   DateTime @default(now())
  completedAt DateTime?
  duration    Int?     // milliseconds
  result      Json?    // Execution result
  error       String?  // Error message if failed
  logs        String?  // Execution logs

  @@index([jobId])
  @@index([status])
  @@index([startedAt])
}

model JobSchedule {
  id          String   @id @default(uuid())
  jobId       String
  job         Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  schedule    String   // Cron expression
  timezone    String   @default("UTC")
  nextRun     DateTime?
  lastRun     DateTime?
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([jobId])
  @@index([enabled])
  @@index([nextRun])
}

model Event {
  id        String   @id @default(uuid())
  name      String
  source    String   // Module name or system
  payload   Json
  createdAt DateTime @default(now())

  @@index([name])
  @@index([source])
  @@index([createdAt])
}

enum JobExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  TIMEOUT
  CANCELLED
}
```

### Step 2: Backend Services

**Services to Create**:

1. **JobQueueService** (`services/job-queue.service.ts`)
   - BullMQ queue management
   - Job enqueueing
   - Queue monitoring

2. **JobSchedulerService** (`services/job-scheduler.service.ts`)
   - Cron-based scheduling
   - Schedule management
   - Next run calculation

3. **JobExecutorService** (`services/job-executor.service.ts`)
   - Job handler loading
   - Execution management
   - Timeout handling

4. **WorkerService** (`services/worker.service.ts`)
   - Worker pool management
   - Job processing
   - Resource cleanup

5. **EventBusService** (`services/event-bus.service.ts`)
   - Event publishing
   - Event subscription
   - Event history

### Step 3: API Endpoints

**Job Management**:
- `GET /api/v1/jobs` - List jobs
- `GET /api/v1/jobs/:id` - Get job details
- `POST /api/v1/jobs` - Create job
- `PUT /api/v1/jobs/:id` - Update job
- `DELETE /api/v1/jobs/:id` - Delete job
- `POST /api/v1/jobs/:id/execute` - Trigger job manually
- `PUT /api/v1/jobs/:id/enable` - Enable job
- `PUT /api/v1/jobs/:id/disable` - Disable job

**Job Execution**:
- `GET /api/v1/jobs/:id/executions` - List executions
- `GET /api/v1/executions/:id` - Get execution details
- `GET /api/v1/executions/:id/logs` - Get execution logs
- `DELETE /api/v1/executions/:id` - Delete execution

**Events**:
- `GET /api/v1/events` - List events
- `GET /api/v1/events/:name` - Get events by name
- `POST /api/v1/events` - Publish event (internal)

### Step 4: Frontend Components

**Pages**:
1. **JobsPage** (`pages/JobsPage.tsx`)
   - Job list with status
   - Create/edit job modal
   - Job details view

2. **JobExecutionsPage** (`pages/JobExecutionsPage.tsx`)
   - Execution history
   - Logs viewer
   - Status filtering

3. **EventsPage** (`pages/EventsPage.tsx`)
   - Event stream
   - Event filtering
   - Event details

**Components**:
1. **JobCard** - Display job information
2. **JobForm** - Create/edit job
3. **ExecutionLogs** - Display execution logs
4. **CronBuilder** - Visual cron expression builder
5. **JobStatusBadge** - Status indicators

### Step 5: Module Integration

**Module Manifest Updates**:

```json
{
  "capabilities": {
    "jobs": {
      "handlers": [
        {
          "name": "sync-inventory",
          "handler": "jobs/sync-inventory.ts",
          "schedule": "0 */6 * * *",
          "timeout": 300000,
          "retries": 3,
          "description": "Sync VMware inventory"
        }
      ]
    },
    "events": {
      "listeners": [
        {
          "event": "vm.created",
          "handler": "events/on-vm-created.ts"
        }
      ],
      "emitters": [
        {
          "event": "inventory.synced",
          "description": "Fired when inventory sync completes"
        }
      ]
    }
  }
}
```

## 🧪 Testing Strategy

### Unit Tests
- JobQueueService tests
- JobSchedulerService tests
- EventBusService tests
- Job execution tests

### Integration Tests
- End-to-end job execution
- Event publishing and subscription
- Schedule trigger tests

### Manual Tests
- Create and execute jobs
- View execution logs
- Test event flow
- Verify cron scheduling

## 📦 Dependencies to Add

**Backend Core Services**:
```json
{
  "bullmq": "^5.0.0",
  "ioredis": "^5.3.0",
  "cron-parser": "^4.9.0",
  "playwright": "^1.40.0",
  "dockerode": "^4.0.0",
  "nodemailer": "^6.9.0",
  "axios": "^1.6.0",
  "socket.io": "^4.6.0"
}
```

**Frontend**:
```json
{
  "react-syntax-highlighter": "^15.5.0",
  "date-fns": "^3.0.0",
  "socket.io-client": "^4.6.0",
  "recharts": "^2.10.0"
}
```

**Docker Images**:
- `mcr.microsoft.com/playwright:v1.40.0-jammy` - Playwright browser container
- `redis:7-alpine` - Redis for job queue and pub/sub

## 🔒 Security Considerations

1. **Job Isolation** - Execute jobs in isolated worker processes
2. **Browser Sandboxing** - Each browser runs in isolated container with resource limits
3. **Resource Limits** - Prevent resource exhaustion (CPU, memory, network)
4. **Permission Checks** - Verify user can create/execute jobs
5. **Input Validation** - Validate cron expressions, configs, and URLs
6. **Log Sanitization** - Remove sensitive data from logs (credentials, tokens)
7. **Network Isolation** - Container network restrictions for browser automation
8. **Secret Management** - Secure storage for API keys and credentials

## 📈 Success Metrics

- ✅ Jobs can be scheduled with cron expressions
- ✅ Jobs execute automatically on schedule
- ✅ Manual job execution works
- ✅ Job logs are captured and viewable
- ✅ Browser automation works (navigate, click, screenshot)
- ✅ Browser sessions are properly isolated in containers
- ✅ Events can be published and consumed across modules
- ✅ UI shows job status and history
- ✅ Failed jobs are retried correctly
- ✅ Timeout handling works
- ✅ Resource limits enforced for jobs and browsers
- ✅ Real-time job status updates in UI

## 🎯 Phase 3 Deliverables

### Backend
- [ ] Job scheduling system with BullMQ and cron support
- [ ] Worker pool for isolated job execution
- [ ] Browser automation with Playwright and container sandboxing
- [ ] Event bus for cross-module communication with Redis pub/sub
- [ ] 15+ API endpoints for jobs, executions, and events
- [ ] Database schema with 4 new tables
- [ ] WebSocket support for real-time updates

### Frontend
- [ ] Jobs management page with CRUD operations
- [ ] Job execution logs viewer with real-time streaming
- [ ] Event stream viewer with filtering
- [ ] Cron schedule builder (visual editor)
- [ ] Real-time status updates via WebSocket
- [ ] System health dashboard

### Browser Automation
- [ ] Playwright service with session pooling
- [ ] Docker/Podman container orchestration
- [ ] Browser context isolation
- [ ] Screenshot and PDF generation
- [ ] Network request interception
- [ ] Cookie and storage management

### Testing
- [ ] Automated test suite for all services
- [ ] Example job handlers with browser automation
- [ ] End-to-end verification tests
- [ ] Performance tests for job queue
- [ ] Browser automation tests

### Documentation
- [ ] API documentation for all endpoints
- [ ] Job handler development guide
- [ ] Browser automation examples
- [ ] Event system guide with schema examples
- [ ] Operator manual for UI
- [ ] Container setup guide

## 🔄 Integration with Phase 2

Jobs, events, and browser automation integrate with the existing module system:
- Modules define jobs and event handlers in their manifest
- Jobs are automatically registered when module is enabled
- Jobs are unregistered when module is disabled
- Events allow modules to communicate asynchronously
- Module routes can trigger events and queue jobs
- Browser automation available to all job handlers

**Example: JobContext Interface**
```typescript
// Core provides this context to all job handlers
interface JobContext {
  // Job configuration
  config: any;

  // Module information
  module: {
    id: string;
    name: string;
    config: any;
  };

  // Core shared services (infrastructure only)
  services: {
    browser: BrowserService;      // Playwright automation
    notifications: NotificationService;  // Email, SMS, webhooks
    http: HttpService;            // HTTP client with retry
    logger: Logger;               // Structured logging
    database: DatabaseService;    // Database helpers
    events: EventBusService;      // Emit/listen to events
  };
}
```

**Example Module: Electricity Consumption Monitor**
```typescript
// modules/electricity-monitor/jobs/scrape-consumption.job.ts
export async function handler(context: JobContext) {
  const { services, module } = context;
  const { browser, events, logger, notifications } = services;

  logger.info('Starting electricity consumption scraping');

  // Use browser service from core
  const browserSession = await browser.createSession({ headless: true });

  try {
    const page = await browserSession.newPage();
    await page.goto(module.config.providerUrl);

    // Login to provider
    await page.fill('#username', module.config.username);
    await page.fill('#password', module.config.password);
    await page.click('#login-button');

    // Scrape current consumption
    const consumptionText = await page.locator('.current-consumption').textContent();
    const consumption = parseFloat(consumptionText);

    // Take screenshot for audit
    const screenshot = await page.screenshot();

    // Emit event for other modules
    await events.emit('electricity.consumption.updated', {
      value: consumption,
      unit: 'kWh',
      timestamp: new Date().toISOString(),
      source: module.config.providerUrl
    });

    // Check threshold
    if (consumption > module.config.alertThreshold) {
      await events.emit('electricity.consumption.high', {
        value: consumption,
        threshold: module.config.alertThreshold,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`Consumption scraped: ${consumption} kWh`);
    return { success: true, consumption, screenshot };

  } finally {
    await browserSession.close();
  }
}
```

**Example Module: Alert Manager**
```typescript
// modules/alert-manager/events/on-high-consumption.event.ts
export async function handler(context: EventContext) {
  const { event, services, module } = context;
  const { notifications, logger } = services;

  logger.warn('High electricity consumption detected', event.payload);

  // Send email alert using notification service from core
  await notifications.email({
    to: module.config.emailRecipients,
    subject: `⚡ High Electricity Consumption Alert`,
    body: `
      Consumption: ${event.payload.value} kWh
      Threshold: ${event.payload.threshold} kWh
      Time: ${event.payload.timestamp}
    `
  });

  // Send webhook if configured
  if (module.config.webhookUrl) {
    await notifications.webhook({
      url: module.config.webhookUrl,
      payload: event.payload
    });
  }
}
```

## 🚀 Next Steps After Phase 3

**Phase 4: First Production Modules**
- **Electricity Consumption Monitor** - Scrape electricity consumption values from provider
- **UPS Monitor** - Monitor UPS status and battery levels
- **Alert Manager** - Centralized alerting (email, SMS, webhooks)
- Time-series data storage for historical metrics (TimescaleDB)
- Real-time dashboards for monitoring

**Phase 5: Production Hardening**
- Security audit and penetration testing
- Performance optimization and load testing
- High availability setup (clustering, failover)
- Comprehensive monitoring and alerting
- Production deployment guide

---

## ✅ Ready to Start?

Phase 3 adds the complete automation engine with browser automation, making this a production-ready automation platform for data center operations.

**Complexity**: High (browser automation + container orchestration)
**Impact**: Very High (enables all core automation features)

All groundwork from Phase 1 and 2 is in place. Let's build it! 🚀
