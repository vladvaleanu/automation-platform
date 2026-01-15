# Phase 5 - Core Services Testing Plan

**Date**: 2026-01-10
**Status**: Testing Required

---

## Test 1: Backend Startup
**Goal**: Verify backend starts without errors after core service extraction

**Steps**:
1. Stop any running backend process
2. Start backend: `npm run dev --workspace=@nxforge/backend`
3. Check for errors in startup logs
4. Verify health endpoint: `curl http://localhost:4000/health`

**Expected**: Backend starts successfully, health check returns 200

---

## Test 2: Scraping Service Integration
**Goal**: Verify ScrapingService from core works in production

**Steps**:
1. Login to frontend: http://localhost:3000/login
2. Navigate to Consumption Monitor > Endpoints
3. Create or edit a test endpoint
4. Click "Test Scraping" button
5. Verify result appears (success or error with details)

**Expected**: Test scraping executes without crashes, returns result

---

## Test 3: Core Services Import
**Goal**: Verify all core services can be imported

**Command**:
```bash
npx tsx -e "
import { 
  ScrapingService, 
  HttpService, 
  StorageService, 
  NotificationService 
} from '@nxforge/core/services';

console.log('✅ All services imported');
console.log('ScrapingService:', typeof ScrapingService);
console.log('HttpService:', typeof HttpService);
console.log('StorageService:', typeof StorageService);
console.log('NotificationService:', typeof NotificationService);
"
```

**Expected**: All services import successfully

---

## Test 4: Clean Up Old Files
**Goal**: Remove deprecated scraping service from backend

**Files to remove**:
- `packages/backend/src/services/scraping.service.ts` (old version)

**Verification**:
```bash
# Check if old service is still referenced
grep -r "from.*services/scraping.service" packages/backend/src/
```

**Expected**: Only the new import from '@nxforge/core/services' should exist

---

## Test 5: Type Checking
**Goal**: Verify TypeScript compilation works

**Command**:
```bash
npm run typecheck --workspace=@nxforge/core
npm run typecheck --workspace=@nxforge/backend
```

**Expected**: No type errors (some warnings are OK)

---

## Test 6: Build All Packages
**Goal**: Verify everything compiles

**Command**:
```bash
npm run build
```

**Expected**: All packages build successfully

---

## Cleanup Tasks After Testing

1. [ ] Remove old scraping service file
2. [ ] Remove any unused imports
3. [ ] Update any internal documentation
4. [ ] Commit changes to git

---

## Issues Found During Testing

(Record any issues here)

