# Data Sync Module

Example module demonstrating the complete job scheduling system capabilities of the Automation Platform.

## Features

This module showcases:

- **Scheduled Jobs**: Three different jobs with various schedules
- **Event-Driven Architecture**: Event emission and subscription
- **Database Integration**: Data persistence and querying
- **HTTP Integration**: External API communication
- **Notifications**: Email reporting
- **Error Handling**: Comprehensive error handling and logging
- **Health Monitoring**: System health checks and alerting

## Jobs

### 1. Hourly Data Sync (`jobs/hourly-sync.js`)

**Schedule**: `0 * * * *` (every hour at minute 0)

**Purpose**: Syncs data from an external API and stores it in the database.

**Features**:
- Fetches data from external API with authentication
- Batch processing for large datasets
- Conflict resolution (insert or update)
- Progress logging
- Success/failure event emission
- Error handling with retries

**Configuration**:
```json
{
  "apiUrl": "https://api.example.com/data",
  "apiKey": "your-api-key",
  "batchSize": 100
}
```

### 2. Daily Report Generator (`jobs/daily-report.js`)

**Schedule**: `0 0 * * *` (every day at midnight)

**Purpose**: Generates comprehensive analytics reports for the previous day.

**Features**:
- Statistics gathering from multiple tables
- Report generation with formatted data
- Database storage of reports
- Email notification with HTML formatting
- Event emission on completion

**Configuration**:
```json
{
  "notificationEmail": "admin@example.com"
}
```

### 3. Health Check (`jobs/health-check.js`)

**Schedule**: `*/5 * * * *` (every 5 minutes)

**Purpose**: Monitors system health and sends alerts if issues detected.

**Features**:
- Database connectivity check
- External API availability check
- Recent sync status verification
- Data freshness monitoring
- System resource monitoring
- Alert emission for unhealthy status

**Configuration**:
```json
{
  "apiUrl": "https://api.example.com"
}
```

## Installation

### 1. Register the Module

```bash
POST /api/v1/modules
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "manifest": {
    // Copy contents from manifest.json
  }
}
```

### 2. Enable the Module

```bash
POST /api/v1/modules/data-sync-module/enable
Authorization: Bearer <your-token>
```

### 3. Create Required Database Tables

```sql
-- Synced data table
CREATE TABLE IF NOT EXISTS synced_data (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  synced_at TIMESTAMP NOT NULL,
  module_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync history table
CREATE TABLE IF NOT EXISTS sync_history (
  id SERIAL PRIMARY KEY,
  module_id VARCHAR(255) NOT NULL,
  job_id VARCHAR(255) NOT NULL,
  execution_id VARCHAR(255) NOT NULL,
  synced_at TIMESTAMP NOT NULL,
  records_processed INTEGER NOT NULL,
  records_failed INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily reports table
CREATE TABLE IF NOT EXISTS daily_reports (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL UNIQUE,
  report_data JSONB NOT NULL,
  generated_at TIMESTAMP NOT NULL,
  module_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Health checks table
CREATE TABLE IF NOT EXISTS health_checks (
  id SERIAL PRIMARY KEY,
  module_id VARCHAR(255) NOT NULL,
  job_id VARCHAR(255) NOT NULL,
  execution_id VARCHAR(255) NOT NULL,
  checked_at TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_synced_data_external_id ON synced_data(external_id);
CREATE INDEX idx_synced_data_synced_at ON synced_data(synced_at);
CREATE INDEX idx_sync_history_module_id ON sync_history(module_id);
CREATE INDEX idx_sync_history_synced_at ON sync_history(synced_at);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);
CREATE INDEX idx_health_checks_module_id ON health_checks(module_id);
CREATE INDEX idx_health_checks_checked_at ON health_checks(checked_at);
```

### 4. Create Jobs

Use the frontend "Create Job" page or API to create jobs for each handler:

```bash
# Hourly Sync Job
POST /api/v1/jobs
{
  "name": "Hourly Data Sync",
  "description": "Syncs data from external API every hour",
  "moduleId": "<data-sync-module-id>",
  "handler": "jobs/hourly-sync.js",
  "schedule": "0 * * * *",
  "enabled": true,
  "timeout": 600000,
  "retries": 3,
  "config": {
    "apiUrl": "https://api.example.com/data",
    "apiKey": "your-api-key",
    "batchSize": 100
  }
}

# Daily Report Job
POST /api/v1/jobs
{
  "name": "Daily Report Generator",
  "description": "Generates daily analytics report",
  "moduleId": "<data-sync-module-id>",
  "handler": "jobs/daily-report.js",
  "schedule": "0 0 * * *",
  "enabled": true,
  "timeout": 900000,
  "retries": 2,
  "config": {
    "notificationEmail": "admin@example.com"
  }
}

# Health Check Job
POST /api/v1/jobs
{
  "name": "Health Check",
  "description": "Monitors system health every 5 minutes",
  "moduleId": "<data-sync-module-id>",
  "handler": "jobs/health-check.js",
  "schedule": "*/5 * * * *",
  "enabled": true,
  "timeout": 30000,
  "retries": 1,
  "config": {
    "apiUrl": "https://api.example.com"
  }
}
```

## Events

### Emitted Events

- `data.sync.requested` - Triggered when sync is requested
- `data.synced` - Emitted when data sync completes successfully
- `data.sync.failed` - Emitted when data sync fails
- `report.generated` - Emitted when daily report is generated
- `health.checked` - Emitted after each health check
- `health.alert` - Emitted when system is unhealthy

### Subscribed Events

- `user.created` - Triggers incremental sync
- `user.updated` - Triggers incremental sync

## Monitoring

### View Job Executions

1. Navigate to **Jobs** page in the frontend
2. Click "History" next to any job
3. View execution status, duration, and logs

### View Events

1. Navigate to **Events** page
2. Filter by event name or source
3. View event statistics and payloads

### Check Health Status

Monitor the Health Check job executions:
- Green status: All checks passed
- Yellow status: Warnings detected
- Red status: Critical issues detected

## Testing

### Manual Execution

Execute any job manually from the Jobs page:
1. Click "Run" button next to the job
2. Job will be queued immediately
3. View execution progress in real-time

### API Testing

```bash
# Execute job manually
POST /api/v1/jobs/<job-id>/execute
Authorization: Bearer <your-token>

# Get execution details
GET /api/v1/executions/<execution-id>
Authorization: Bearer <your-token>
```

## Troubleshooting

### Job Not Executing

- Verify job is enabled
- Check cron expression is valid
- Ensure module is enabled
- Review job logs for errors

### External API Errors

- Verify API URL is correct
- Check API key is valid
- Ensure network connectivity
- Review timeout settings

### Database Errors

- Verify tables exist
- Check database permissions
- Review connection settings
- Monitor connection pool

## Customization

### Adding New Jobs

1. Create a new job handler file in `jobs/` directory
2. Export async function that accepts `context` parameter
3. Implement job logic using `context.services`
4. Add job definition to `manifest.json`
5. Create job via API or frontend

### Modifying Schedules

1. Navigate to Jobs page
2. Find the job to modify
3. Click "Edit" (or use API)
4. Update schedule field
5. Save changes

### Event Subscriptions

Add new event subscriptions in `index.js`:

```javascript
events.on('your.event.name', async (event) => {
  // Handle event
});
```

## Best Practices

1. **Error Handling**: Always wrap job logic in try-catch blocks
2. **Logging**: Use structured logging with context
3. **Batch Processing**: Process large datasets in batches
4. **Timeouts**: Set appropriate timeout values
5. **Retries**: Configure retry count based on failure type
6. **Events**: Emit events for important state changes
7. **Monitoring**: Monitor job execution metrics
8. **Testing**: Test jobs manually before scheduling

## License

MIT
