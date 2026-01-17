# Phase 7.4: Frontend Component Extraction - Approach

**Date**: 2026-01-10
**Status**: Planning

## Current Situation

### Backend (✅ Complete)
- Module fully extracted and working
- Routes served at `/api/v1/m/consumption-monitor/*`
- Module loads dynamically at runtime

### Frontend (⏸️ Not Started)
- Pages still in `packages/frontend/src/pages/`
- Routes hardcoded in App.tsx
- Sidebar items hardcoded in Sidebar.tsx
- API client uses old `/consumption/*` paths

## Challenge

The current ModuleRouteLoader expects modules to be fetched from URLs, but our consumption-monitor module is local. We have two options:

### Option A: Full Dynamic Loading (Complex)
- Build module UI as separate bundle
- Serve from backend or CDN
- Load via ModuleRouteLoader at runtime
- **Pros**: True plugin architecture
- **Cons**: Requires build pipeline, module federation, complex setup

### Option B: Direct Import with Module Structure (Pragmatic)
- Keep UI files in module directory
- Import directly in frontend (not dynamically)
- Update API paths to use module routes
- Keep module structure for future migration
- **Pros**: Simple, works immediately, maintains structure
- **Cons**: Not truly dynamic (requires rebuild)

## Recommended Approach: Option B (Pragmatic)

For Phase 7, we'll use Option B to:
1. Maintain momentum and complete the refactoring
2. Prove the module structure works
3. Keep the door open for full dynamic loading later

### Steps:

1. **Update API Client Paths**
   - Change `/consumption/*` to `/m/consumption-monitor/*`
   - Keep API client in frontend for now
   - Module-specific API could be extracted later

2. **Keep Pages in Place (For Now)**
   - Pages work correctly with updated API paths
   - No need to move files until dynamic loading is ready
   - Document where they belong in module structure

3. **Update Progress Document**
   - Mark frontend extraction as "deferred"
   - Focus on completing Phase 7.5 (Job Testing)
   - Plan Phase 8 for full UI module loading

## Rationale

**Why defer full UI extraction:**
- Frontend module loading requires significant infrastructure
- Would need webpack module federation or similar
- Backend module system is proven and working
- Can add UI loading in Phase 8 with proper planning

**What we accomplish now:**
- Fix API paths to use module routes
- Prove end-to-end functionality works
- Complete Phase 7 backend extraction
- Set foundation for future UI modularity

## Next Steps

1. Update consumption API to use `/m/consumption-monitor/*` paths
2. Test all frontend pages work with new API
3. Document UI module structure for future extraction
4. Move to Phase 7.5: Job Handler Testing
5. Plan Phase 8 for full UI module loading system

## Future: Full UI Module Loading (Phase 8+)

When ready to implement dynamic UI loading:
- Set up webpack module federation
- Create module UI build pipeline
- Implement module bundle serving
- Enhance ModuleRouteLoader for true dynamic loading
- Support hot module reload for development

For now, let's keep it simple and functional. ✅
