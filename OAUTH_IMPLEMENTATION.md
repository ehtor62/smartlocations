# OAuth Bearer Token Authentication Implementation

## Overview
Successfully migrated from Basic Authentication to OAuth Bearer token authentication using Firebase ID tokens.

## What Changed

### 1. **Server-Side Authentication** (`utils/server-auth.ts`)
- Added Firebase Admin SDK for server-side token verification
- Created `verifyAuthToken()` function to validate Bearer tokens
- Created `requireAuth()` middleware helper for API routes
- Validates user email against `NEXT_PUBLIC_ALLOWED_EMAIL` environment variable

### 2. **Client-Side Authentication** (`utils/client-auth.ts`)
- Created `getAuthToken()` to retrieve Firebase ID token from authenticated user
- Created `authenticatedFetch()` wrapper that automatically adds Bearer token to requests
- Throws error if user is not authenticated

### 3. **API Routes Protected**
All API endpoints now require valid Firebase authentication:
- `/api/gemini` - AI responses
- `/api/search` - Location search
- `/api/address-search` - Address geocoding
- `/api/reverse-geocode` - Reverse geocoding

Each route now:
1. Calls `requireAuth(request)` at the start
2. Returns 401 Unauthorized if token is invalid
3. Validates email against allowed list
4. Only processes request if authenticated

### 4. **Client Updates**
Updated all fetch calls to use `authenticatedFetch()`:
- `app/page.tsx` - All search and geocoding calls (11 locations)
- `components/SidePanel.tsx` - Gemini AI calls

### 5. **Middleware Changes** (`middleware.ts`)
- Disabled Basic Authentication
- API routes now handle authentication individually
- Old basic auth code preserved in comments for reference

## Security Improvements

✅ **Token-based authentication** - JWT tokens instead of plaintext credentials  
✅ **Per-request validation** - Each API call is authenticated independently  
✅ **Email whitelist** - Only `NEXT_PUBLIC_ALLOWED_EMAIL` can access APIs  
✅ **Standard OAuth flow** - Industry-standard Bearer token pattern  
✅ **No session storage** - Stateless authentication  
✅ **Automatic token refresh** - Firebase handles token expiration  

## Environment Variables Required

```env
# Firebase Project ID (used by firebase-admin)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=smartlocations-43fcd

# Allowed email for API access
NEXT_PUBLIC_ALLOWED_EMAIL=martin.r.rothe@gmail.com

# Gemini API (unchanged)
GEMINI_API_KEY=...

# Basic auth credentials (now optional, only for site-wide protection if re-enabled)
BASIC_AUTH_USER=...
BASIC_AUTH_PASSWORD=...
```

## How It Works

### Client Flow:
1. User signs in with Firebase (Google OAuth or Email/Password)
2. Client obtains Firebase ID token via `getIdToken()`
3. Client includes token as `Authorization: Bearer <token>` in API requests
4. If not authenticated, API calls throw error prompting user to sign in

### Server Flow:
1. API route receives request with `Authorization` header
2. `requireAuth()` extracts Bearer token
3. Firebase Admin SDK verifies token cryptographically
4. Checks if token email matches `NEXT_PUBLIC_ALLOWED_EMAIL`
5. Returns 401 if invalid, allows request if valid

## Testing

To test the authentication:
1. Sign out and try to use features - should see authentication errors
2. Sign in with the allowed email - all features should work
3. Try signing in with different email - should be rejected

## Future Enhancements

Consider adding:
- Multiple allowed emails (array in environment variable)
- Role-based access control (RBAC)
- Rate limiting per user
- Audit logging of API access
- Token refresh handling on client
- Service account key for production (currently using project ID only)

## Rollback Instructions

To revert to Basic Auth:
1. Uncomment middleware code in `middleware.ts`
2. Replace `authenticatedFetch()` calls with regular `fetch()`
3. Remove `requireAuth()` calls from API routes
