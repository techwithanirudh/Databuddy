## @databuddy/auth

### Overview
- Wraps `better-auth` with Drizzle adapter, email providers, OTP, magic links, organizations, and custom session fields.
- Exports:
  - `auth`: Better Auth instance (`auth.api.getSession({ headers })`, etc.)
  - `websitesApi`: `{ hasPermission: auth.api.hasPermission }`
  - Types: `User`, `Session`
  - Permissions/roles helpers

### Getting the current session (server)
```ts
import { auth } from '@databuddy/auth';

const session = await auth.api.getSession({ headers: request.headers });
if (!session?.user) {
  // not authenticated
}
```

### Checking website permissions
```ts
import { websitesApi } from '@databuddy/auth';

const { success } = await websitesApi.hasPermission({
  headers: request.headers,
  body: { permissions: { website: ['read'] } },
});
```

### Notes
- The package configures email delivery using Resend and sends verification, magic link, OTP, and invitation emails.
- Sessions are cached with Redis for performance.