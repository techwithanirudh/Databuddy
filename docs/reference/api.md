## HTTP API

Base URL examples:
- Production: `https://api.databuddy.cc`
- Local dev: your `apps/api` server (default port 3001)

Authentication:
- Most routes require either a logged-in session cookie or an `x-api-key` header scoped to the website.

### Health
- **GET** `/health`
- Returns service status for ClickHouse, Database, and Redis.
- Example:
```bash
curl -s https://api.databuddy.cc/health | jq
```

### Query API (analytics)
- **Prefix**: `/v1/query`
- Applies website authentication middleware. If `website_id` is required and the site is not public, you must be authenticated (session or `x-api-key`).

- **GET** `/v1/query/types?include_meta=true`
  - Returns available query types and configuration (allowed filters, defaults, optional meta).
  - Example:
```bash
curl -s "https://api.databuddy.cc/v1/query/types?include_meta=true" \
  -H "cookie: ...session..." | jq
```

- **POST** `/v1/query/compile`
  - Validates and compiles a query request without executing it.
  - Body fields:
    - `projectId` (string), `type` (string), `from` (ISO date), `to` (ISO date)
    - Optional: `timeUnit`, `filters[]`, `groupBy[]`, `orderBy`, `limit`, `offset`
  - Example:
```bash
curl -s -X POST https://api.databuddy.cc/v1/query/compile?website_id=WEBSITE_ID \
  -H "content-type: application/json" \
  -H "cookie: ...session..." \
  -d '{
    "projectId": "WEBSITE_ID",
    "type": "summary_overview",
    "from": "2025-01-01",
    "to": "2025-01-31",
    "timeUnit": "day",
    "limit": 100
  }' | jq
```

- **POST** `/v1/query`
  - Executes one or more dynamic query requests. Supports batch input (array).
  - Body (single request):
    - `parameters`: Array of strings or objects `{ name, start_date?, end_date?, granularity?, id? }`
    - Optional: `limit`, `page`, `filters[]`, `granularity`, `groupBy`, `startDate`, `endDate`, `timeZone`
  - Example (single):
```bash
curl -s -X POST "https://api.databuddy.cc/v1/query?website_id=WEBSITE_ID" \
  -H "content-type: application/json" \
  -H "x-api-key: YOUR_WEBSITE_API_KEY" \
  -d '{
    "parameters": ["summary_overview"],
    "limit": 50,
    "granularity": "daily"
  }' | jq
```
  - Example (batch):
```bash
curl -s -X POST "https://api.databuddy.cc/v1/query?website_id=WEBSITE_ID" \
  -H "content-type: application/json" \
  -H "cookie: ...session..." \
  -d '[
    { "parameters": ["summary_overview"], "granularity": "daily" },
    { "parameters": [{ "name": "pages_top", "start_date": "2025-01-01", "end_date": "2025-01-31" }] }
  ]' | jq
```

### Assistant API (streaming)
- **Prefix**: `/v1/assistant`
- **POST** `/v1/assistant/stream`
  - Streams assistant responses for a given website and message.
  - Body: `{ message: string, website_id: string, model?: 'chat'|'agent'|'agent-max', context?: { previousMessages?: { role?: string, content: string }[] } }`
  - Example (fetch streaming):
```ts
async function streamAssistant() {
  const res = await fetch('https://api.databuddy.cc/v1/assistant/stream?website_id=WEBSITE_ID', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cookie': '...session...' },
    body: JSON.stringify({ message: 'Show sessions trend', website_id: 'WEBSITE_ID' })
  });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    console.log(decoder.decode(value)); // streaming updates
  }
}
```

### Authentication Notes
- Routes enforce website access using either session cookies or `x-api-key` with appropriate scope. Public websites bypass auth for read access.