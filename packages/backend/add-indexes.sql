-- Add performance indexes
-- Generated: 2026-01-11

-- Module status index (frequently filtered)
CREATE INDEX IF NOT EXISTS "idx_modules_status" ON "modules"("status");

-- Composite indexes for job executions (common query patterns)
CREATE INDEX IF NOT EXISTS "idx_job_executions_job_status" ON "job_executions"("jobId", "status");
CREATE INDEX IF NOT EXISTS "idx_job_executions_status_started" ON "job_executions"("status", "startedAt");

-- Event composite index (filter by name and time)
CREATE INDEX IF NOT EXISTS "idx_events_name_created" ON "events"("name", "createdAt");

-- Verify indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY
    tablename, indexname;
