# GitHub Codespaces CORS Fix

## Issue
When accessing the frontend through GitHub Codespaces proxy URLs, CORS is being blocked even though the backend is correctly configured.

**Error**:
```
Access to XMLHttpRequest at 'https://...-4000.app.github.dev/api/v1/auth/login'
from origin 'https://...-3000.app.github.dev' has been blocked by CORS policy
```

## Root Cause
GitHub Codespaces proxies ports through their domain, and by default ports are set to "Private" visibility which strips CORS headers for security.

## Solution

### Option 1: Make Ports Public (Recommended)

1. **In VS Code** (bottom panel):
   - Click on the **"PORTS"** tab
   - Find port **3000** (frontend)
   - Right-click → **Port Visibility** → **Public**
   - Find port **4000** (backend)
   - Right-click → **Port Visibility** → **Public**

2. **Alternative - Using Command Palette**:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Ports: Change Port Visibility"
   - Select port 3000 → Public
   - Select port 4000 → Public

3. **After changing to Public**:
   - Refresh the browser (the frontend page)
   - Login should now work

### Option 2: Access Locally (Development)

Instead of using GitHub's proxy URLs, access the app locally:

1. **Frontend**: `http://localhost:3000`
2. **Backend**: `http://localhost:4000`

This bypasses the GitHub proxy entirely and CORS works normally.

## Verification

After making ports public, test:

1. Open frontend: `https://your-codespace-3000.app.github.dev`
2. Try to login
3. Check browser console - CORS error should be gone

## Technical Details

**Backend CORS is configured correctly**:
```typescript
// app.ts - Line 31-45
reply.header('Access-Control-Allow-Origin', origin);
reply.header('Access-Control-Allow-Credentials', 'true');
reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
// ... handles preflight requests
```

**Verified working locally**:
```bash
curl -X OPTIONS http://localhost:4000/api/v1/auth/login \
  -H "Origin: https://...-3000.app.github.dev"
# ✅ Returns all CORS headers correctly
```

**The issue**: GitHub Codespaces private ports strip headers for security.

---

## For Future Deployments

When deploying to production:
- CORS configuration in backend is production-ready
- Works with any origin
- Handles preflight requests correctly
- No changes needed

---

*Issue identified: 2026-01-10 01:33 UTC*
*Resolution: Make ports 3000 and 4000 public in Codespaces*
