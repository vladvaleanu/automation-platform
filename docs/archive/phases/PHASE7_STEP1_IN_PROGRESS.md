# Phase 7, Step 7.1: Consumption Monitor Module - In Progress

## Overview

Extracting the hardcoded consumption monitor into a standalone NxForge module using the new dynamic module system built in Phase 6.

## Critical Fix: Module Loading Authentication (COMPLETED ✅)

### Problem
The frontend was attempting to load modules on app startup before authentication, causing 401 Unauthorized errors.

### Solution
Moved module initialization to happen after authentication is confirmed in `AuthContext`:

**Files Modified**:
- [packages/frontend/src/contexts/AuthContext.tsx](packages/frontend/src/contexts/AuthContext.tsx)
  - Load modules after authentication check on mount
  - Load modules after successful login
  - Reset modules on logout
- [packages/frontend/src/App.tsx](packages/frontend/src/App.tsx)
  - Removed module loading logic from app mount
  - Removed loading screen
  - Removed error banner

**Documentation**: [MODULE_LOADING_AUTH_FIX.md](MODULE_LOADING_AUTH_FIX.md)

## Module Directory Structure (COMPLETED ✅)

Created proper module structure at `/workspaces/nxforge/modules/consumption-monitor/`:

```
modules/consumption-monitor/
├── package.json          ✅ Created
├── tsconfig.json         ✅ Created
├── manifest.json         ✅ Created (v2 schema)
├── src/
│   ├── index.ts         ✅ Created (entry point)
│   ├── routes/          📝 In Progress
│   ├── jobs/            📝 In Progress
│   ├── migrations/      📝 Pending
│   └── ui/              📝 Pending
│       ├── pages/
│       └── components/
└── dist/                (build output)
```

## Files Created

### 1. `modules/consumption-monitor/package.json`
- Package name: `@nxforge/consumption-monitor`
- Version: 1.0.0
- Type: ES module
- Dependencies: `@nxforge/core` (workspace)
- Scripts: build, clean, rebuild, watch

### 2. `modules/consumption-monitor/tsconfig.json`
- Extends root tsconfig
- Output: `dist/`
- Source: `src/`
- Generates declarations and source maps

### 3. `modules/consumption-monitor/manifest.json` (v2 schema)
- Schema version: 2.0
- Module name: `consumption-monitor`
- Runtime configuration:
  - Entry: `dist/index.js`
  - Routes: `dist/routes/index.js`
  - Jobs: `dist/jobs/index.js`
  - Migrations: `src/migrations`
- API prefix: `/consumption`
- Jobs: `collect-consumption` with configuration
- UI routes:
  - `/consumption/live` → LiveDashboard
  - `/consumption/endpoints` → Endpoints
  - `/consumption/reports` → Reports
  - `/consumption/history` → History
- Sidebar configuration with icon ⚡ and children
- Permissions: database:read, database:write, network:outbound, filesystem:write
- Dependencies: prisma, logger, scraping services

### 4. `modules/consumption-monitor/src/index.ts`
- Module entry point
- Exports `initialize()` and `cleanup()` functions
- Logs module lifecycle events

## Next Steps

### Immediate (Current Session)
1. **Create Route Handlers** - Extract from `packages/backend/src/routes/consumption.routes.ts`
   - GET `/readings` - Query consumption readings
   - GET `/monthly/:endpointId` - Monthly consumption summary
   - GET `/current` - Current month consumption for all endpoints
   - GET `/stats` - Overall statistics

2. **Create Job Handler** - Extract from `packages/backend/data/modules/consumption-monitor/jobs/collect-consumption.js`
   - Update to TypeScript
   - Use @nxforge/core types
   - Proper error handling

3. **Create Migrations**
   - Extract consumption-related models from Prisma schema
   - Create SQL migrations:
     - `001_create_endpoints.sql`
     - `002_create_consumption_readings.sql`
     - `003_create_timescaledb_hypertable.sql`

4. **Build and Test**
   - Run `npm run build` in module directory
   - Register module with backend
   - Test module loading
   - Verify routes and jobs work

### Future (Next Session)
5. **Extract Frontend UI**
   - Move pages from `packages/frontend/src/pages/` to module
   - Move components to module
   - Update imports
   - Test dynamic route loading

6. **Remove Hardcoded Code**
   - Delete old consumption routes from backend
   - Delete old consumption pages from frontend
   - Clean up old references

7. **Test End-to-End**
   - Enable module via API
   - Verify sidebar appears
   - Test all routes
   - Run collection job
   - Verify data flows correctly

## Benefits of This Approach

1. **Modular Architecture**: Consumption monitor is self-contained
2. **Dynamic Loading**: Can be enabled/disabled without code changes
3. **Independent Versioning**: Module has its own version
4. **Database Migrations**: Automatically applied when module loads
5. **Clean Separation**: Module code isolated from core platform
6. **Reusable**: Can be shared across NxForge installations

## Technical Notes

### Module v2 Schema
The new manifest uses the v2 schema with:
- `schema: "2.0"` field
- `runtime` section for entry points
- `api` section for API configuration
- `ui` section for frontend routes and sidebar

### TypeScript Configuration
- Extends root tsconfig for consistency
- Generates declaration files for type safety
- Composite build for incremental compilation

### Dependencies
- Module depends on `@nxforge/core` for:
  - Type definitions (ModuleContext, etc.)
  - Shared services (scraping, notification, etc.)
  - Validation utilities

## Current Status

- ✅ Authentication fix completed and tested
- ✅ Module directory structure created
- ✅ Configuration files created
- ✅ Entry point created
- 📝 Route handlers in progress
- 📝 Job handlers in progress
- ⏳ Migrations pending
- ⏳ Frontend UI extraction pending
- ⏳ Build and testing pending

## Files Modified/Created

### Modified
- [packages/frontend/src/contexts/AuthContext.tsx](packages/frontend/src/contexts/AuthContext.tsx)
- [packages/frontend/src/App.tsx](packages/frontend/src/App.tsx)

### Created
- [MODULE_LOADING_AUTH_FIX.md](MODULE_LOADING_AUTH_FIX.md)
- [modules/consumption-monitor/package.json](modules/consumption-monitor/package.json)
- [modules/consumption-monitor/tsconfig.json](modules/consumption-monitor/tsconfig.json)
- [modules/consumption-monitor/manifest.json](modules/consumption-monitor/manifest.json)
- [modules/consumption-monitor/src/index.ts](modules/consumption-monitor/src/index.ts)
- This progress document

## Testing Recommendations

1. **Authentication Flow**:
   - Clear localStorage and log in fresh
   - Verify modules load after authentication
   - Check console for module loading logs
   - Verify no 401 errors in network tab

2. **Module Structure**:
   - Verify all directories exist
   - Check package.json is valid
   - Verify tsconfig.json extends root config
   - Validate manifest.json against v2 schema

---

**Session Status**: In Progress
**Next Action**: Continue creating route and job handlers
