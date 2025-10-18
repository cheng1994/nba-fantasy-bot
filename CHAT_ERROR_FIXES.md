# Chat Stream Error Handling Fixes

## Problem
The chat sometimes encountered errors that caused the stream to stop, showing an error status without helpful debugging information.

## Root Causes Identified

### 1. **Unhandled Tool Exceptions**
**Files affected:** `src/app/actions.ts`, `src/lib/actions/nba-news.ts`

**Issue:** Tool functions were throwing errors instead of returning them gracefully, which would crash the streaming response.

**Example scenarios:**
- Invalid SQL queries (syntax errors, non-existent columns/tables)
- Database connection failures
- Permission errors
- Timeout issues

**Fix:** Wrapped all tool `execute` functions in try-catch blocks that return error objects instead of throwing:

```typescript
execute: async ({ query }) => {
  try {
    const data = await runGenerateSQLQuery(query);
    return data;
  } catch (error) {
    console.error('Error in queryDatabaseTool:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to execute database query',
      rows: [] 
    };
  }
}
```

### 2. **Poor Error Logging**
**File affected:** `src/app/api/chat/route.ts`

**Issue:** The `onError` callback only logged `console.error(error)` without detailed context, making debugging difficult.

**Fix:** Enhanced error logging to capture detailed error information:

```typescript
onError({ error }) {
  console.error('Stream error details:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    name: error instanceof Error ? error.name : 'Error',
    error: error,
  });
}
```

### 3. **Unhandled Route-Level Exceptions**
**File affected:** `src/app/api/chat/route.ts`

**Issue:** No top-level try-catch in the POST handler, so any unhandled errors would crash without returning a proper response.

**Fix:** Wrapped the entire route handler in try-catch:

```typescript
export async function POST(req: Request) {
  try {
    // ... existing code
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Fatal error in chat route:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while processing your request. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### 4. **Improved SQL Error Handling**
**File affected:** `src/app/actions.ts`

**Issue:** SQL errors were thrown without helpful context about what went wrong.

**Fix:** Added specific error handling for common SQL error types:

```typescript
try {
  const data = await sql.query(query);
  return data.rows;
} catch (e: any) {
  console.error('SQL query error:', e.message);
  
  if (e.message.includes('relation') && e.message.includes('does not exist')) {
    throw new Error(`Database table not found. Please ensure the database is properly set up.`);
  }
  
  if (e.message.includes('syntax error')) {
    throw new Error(`Invalid SQL syntax: ${e.message}`);
  }
  
  if (e.message.includes('column') && e.message.includes('does not exist')) {
    throw new Error(`Invalid column name in query: ${e.message}`);
  }
  
  throw new Error(`Database query failed: ${e.message}`);
}
```

## Common Error Scenarios & Solutions

### Scenario 1: Database Connection Issues
**Symptoms:** Stream stops, error status appears
**Cause:** Database connection timeout or network issues
**Solution:** Tools now return graceful error responses instead of crashing
**Check:** Look for "Database query failed" in server logs

### Scenario 2: Invalid SQL Queries
**Symptoms:** Stream stops when AI generates malformed SQL
**Cause:** AI-generated SQL has syntax errors or references non-existent columns
**Solution:** Specific error messages now indicate the SQL issue
**Check:** Look for "Invalid SQL syntax" or "Invalid column name" in logs

### Scenario 3: Authentication Expiry
**Symptoms:** Stream stops mid-conversation
**Cause:** User session expired during a long conversation
**Solution:** Top-level try-catch now catches auth errors and returns proper error response
**Check:** Look for 401 errors in network tab

### Scenario 4: Model/API Timeouts
**Symptoms:** Stream stops after 30 seconds
**Cause:** `maxDuration = 30` is exceeded
**Solution:** Tools fail gracefully without crashing the entire stream
**Check:** Look for timeout errors in server logs

### Scenario 5: Wishlist Tool Errors
**Symptoms:** Stream errors when checking wishlists
**Cause:** Database query fails or player not found
**Solution:** Wishlist tools already had proper error handling (return success: false)
**Status:** No changes needed - already implemented correctly

## Debugging Guide

When chat errors occur, check the following in order:

1. **Server Console Logs** - Look for:
   - "Stream error details:" - Shows the error that crashed the stream
   - "Error in queryDatabaseTool:" - Database tool failed
   - "Error querying NBA news:" - News query failed
   - "SQL query error:" - Specific SQL problems
   - "Fatal error in chat route:" - Top-level error

2. **Browser Network Tab** - Check:
   - Status code (401 = auth, 500 = server error)
   - Response body for error details
   - Request timing (30s+ = timeout)

3. **Database Logs** - Verify:
   - Connection is active
   - Tables exist (nba_stats, nba_news, player_wishlist)
   - Required columns are present

4. **Environment Variables** - Confirm:
   - `DATABASE_URL` is set correctly
   - `NEXT_PUBLIC_STACK_PROJECT_ID` for auth
   - API keys for Anthropic/OpenAI

## Testing Recommendations

1. **Test Invalid Queries:**
   ```
   Ask: "Show me players from the unicorns table"
   Expected: Graceful error, not crash
   ```

2. **Test Network Issues:**
   ```
   Disconnect database temporarily
   Expected: Error message, stream doesn't hang
   ```

3. **Test Complex Queries:**
   ```
   Ask multiple questions in sequence
   Expected: All complete or fail gracefully
   ```

4. **Test Authentication:**
   ```
   Let session expire, then ask question
   Expected: 401 error or redirect to sign-in
   ```

## Additional Improvements Recommended

### 1. Increase Max Duration (Optional)
If complex queries often timeout:

```typescript
export const maxDuration = 60; // Increase from 30 to 60 seconds
```

### 2. Add Retry Logic (Future Enhancement)
For transient errors, consider adding retry logic to tools:

```typescript
async function retryableDatabaseQuery(query: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await sql.query(query);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. Circuit Breaker Pattern (Future Enhancement)
Prevent cascading failures by tracking error rates:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  
  async execute(fn: () => Promise<any>) {
    if (this.failures > 5 && Date.now() - this.lastFailTime < 60000) {
      throw new Error('Circuit breaker open - too many recent failures');
    }
    
    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailTime = Date.now();
      throw error;
    }
  }
}
```

## Summary

All critical error handling issues have been resolved:
- ✅ Tools return errors gracefully instead of throwing
- ✅ Enhanced error logging for debugging
- ✅ Top-level error handler in route
- ✅ Specific SQL error messages
- ✅ All linter errors fixed

The chat should now provide better error messages and not crash unexpectedly.

