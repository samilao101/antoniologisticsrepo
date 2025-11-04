# Logging System

This project includes a comprehensive logging system to help you debug and monitor your application.

## Viewing Logs

### HTML Interface (Recommended)
Visit the logs endpoint with HTML format:
```
https://your-site.vercel.app/api/logs?format=html
```

This provides a beautiful web interface with:
- 📊 Color-coded log levels (Info, Error, Warn, Debug)
- 🔍 Filter by log level
- 🔄 Refresh button
- 🗑️ Clear logs button
- ⏰ Timestamps
- 📝 Detailed error information

### JSON Format
For programmatic access:
```
https://your-site.vercel.app/api/logs
```

Returns:
```json
{
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00.000Z",
      "level": "info",
      "message": "Processing chat message",
      "details": { "sessionId": "default", "messageLength": 45 },
      "endpoint": "/api/chat"
    }
  ],
  "count": 1
}
```

## What Gets Logged

### Chat API (`/api/chat`)
- ✅ Chat message received
- ✅ OpenAI API calls
- ✅ AI function calls (save_html)
- ✅ HTML updates
- ✅ Errors and exceptions

### Get Site (`/api/get-site`)
- ✅ Site data fetched
- ✅ Content availability
- ✅ Errors

### Conversation (`/api/conversation`)
- ✅ Conversation fetched
- ✅ Message counts
- ✅ Errors

### Clear Conversation (`/api/clear-conversation`)
- ✅ Conversation cleared
- ✅ Errors

## Log Levels

### 🔵 INFO
Normal operations, successful requests
```typescript
await logger.info('Processing chat message', { sessionId });
```

### 🔴 ERROR
Errors and exceptions
```typescript
await logger.error('Error in chat API', { error: String(error) });
```

### 🟡 WARN
Warnings and potential issues
```typescript
await logger.warn('Chat request without message', {});
```

### 🟣 DEBUG
Detailed debugging information
```typescript
await logger.debug('Fetching conversation from KV', { sessionId });
```

## Log Storage

- Logs are stored in **Vercel KV** (Redis)
- Maximum **100 logs** kept (most recent)
- **24-hour TTL** (auto-deleted after 24 hours)
- Also logged to **Vercel console** (Function Logs)

## Clearing Logs

### Via Web Interface
1. Visit `/api/logs?format=html`
2. Click "🗑️ Clear Logs" button
3. Confirm deletion

### Via API
```bash
curl -X DELETE https://your-site.vercel.app/api/logs
```

## Using Logger in Your Code

Import the logger:
```typescript
import { logger } from '@/lib/logger';
```

Log messages:
```typescript
// Info
await logger.info('User logged in', { userId: '123' }, '/api/auth');

// Error
await logger.error('Database connection failed', {
  error: String(err),
  stack: err.stack
}, '/api/data');

// Warning
await logger.warn('API rate limit approaching', {
  requests: 95,
  limit: 100
});

// Debug
await logger.debug('Cache hit', { key: 'user:123' });
```

## Debugging Tips

### Check Logs After Errors
1. Visit `/api/logs?format=html`
2. Filter by "Errors" level
3. Review error details and stack traces

### Monitor OpenAI API Calls
1. Look for "Calling OpenAI API" entries
2. Check "OpenAI API response received"
3. Verify "hasToolCalls" in details

### Track HTML Updates
1. Search for "AI called save_html function"
2. Check "Saving updated HTML to KV"
3. Verify "HTML saved successfully"

### Verify KV Operations
1. Look for "Fetching conversation from KV"
2. Check "Fetching current HTML from KV"
3. Ensure no KV-related errors

## Example Log Flow

When a user sends a chat message:

```
1. [INFO] Processing chat message
   → sessionId: "default", messageLength: 45

2. [DEBUG] Fetching conversation from KV
   → sessionId: "default"

3. [DEBUG] Fetching current HTML from KV

4. [DEBUG] Creating AI response
   → messageCount: 3

5. [INFO] Calling OpenAI API
   → model: "gpt-4-turbo-preview"

6. [INFO] OpenAI API response received
   → hasToolCalls: true

7. [INFO] AI called save_html function
   → description: "Created landing page..."

8. [INFO] Saving updated HTML to KV
   → htmlLength: 15432

9. [INFO] HTML saved successfully

10. [INFO] Chat request completed successfully
    → htmlUpdated: true
```

## Security Notes

⚠️ **Important**: The `/api/logs` endpoint is currently **unprotected**. Anyone who knows the URL can view logs.

### Recommendations:

1. **Change the URL** to something secret:
   ```
   /api/secret-logs-xyz789
   ```

2. **Add authentication** (future enhancement):
   ```typescript
   const authHeader = request.headers.get('authorization');
   if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

3. **Use Vercel deployment protection** to password-protect your entire site

## Troubleshooting

### Logs Not Appearing
- Check Vercel KV is connected
- Verify environment variables are set
- Look at Vercel Function Logs as backup

### KV Connection Errors
- Logs fall back to console only
- Check Vercel dashboard for KV status
- Verify KV environment variables

### Old Logs Disappearing
- Logs have 24-hour TTL (by design)
- Only last 100 logs kept (by design)
- Check Vercel Function Logs for historical data

## Access URLs

After deployment:

- **Production**: `https://antoniologistics.com/api/logs?format=html`
- **Vercel**: `https://your-project.vercel.app/api/logs?format=html`
- **Local**: `http://localhost:3000/api/logs?format=html`

---

## Quick Reference

| Action | URL |
|--------|-----|
| View logs (HTML) | `/api/logs?format=html` |
| View logs (JSON) | `/api/logs` |
| Clear logs | `DELETE /api/logs` |

Logs are your friend! Use them to debug issues quickly. 🚀
