# Buffer Rate Limits & Polling Guide

This guide covers managing Buffer API rate limits, handling HTTP 429 errors, and implementing efficient data synchronization via polling in the absence of webhooks.

---

## 1. Rate Limit Tiers

Buffer enforces plan-based rate limits shared across all API keys and MCP connections belonging to an organization:

| Subscription Tier | 15-Minute Window | 24-Hour Window | 30-Day Window |
| :--- | :--- | :--- | :--- |
| **Free** | 150 requests | 600 requests | 1,000 / channel (max 3,000) |
| **Essentials** | 450 requests | 1,800 requests | 3,000 / channel (max 30,000) |
| **Team** | 1,500 requests | 6,000 requests | 10,000 / channel (max 100,000) |

---

## 2. Tracking Limits via Response Headers

Every successful GraphQL response from `https://api.buffer.com` includes rate limit telemetry:

```http
HTTP/1.1 200 OK
Content-Type: application/json
RateLimit: limit=150, remaining=142, reset=600
RateLimit-Policy: 150;w=900
```

- **`remaining`**: The number of requests remaining in the current window.
- **`reset`**: The number of seconds until the current window resets.
- **`w`**: The window duration in seconds (e.g. `900` = 15 minutes).

---

## 3. Handling HTTP 429 Too Many Requests

When your application exceeds its quota, Buffer returns `HTTP 429 Too Many Requests` with a mandatory `Retry-After` header:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
Content-Type: application/json

{
  "errors": [
    {
      "message": "RATE_LIMIT_EXCEEDED: You have exceeded your 15-minute rate limit."
    }
  ]
}
```

### Exponential Backoff Implementation (TypeScript)
```typescript
import axios, { AxiosError } from 'axios';

export async function executeWithRetry<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      attempt++;
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 429 && attempt < maxRetries) {
        const retryAfterHeader = axiosError.response.headers['retry-after'];
        const waitSeconds = retryAfterHeader
          ? parseInt(retryAfterHeader, 10)
          : Math.pow(2, attempt) + Math.random();

        console.warn(`Rate limit hit. Retrying in ${waitSeconds}s (attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
        continue;
      }

      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}
```

---

## 4. Polling Strategy for Data Synchronization

Because Buffer's public API does **not** provide outbound webhooks for social publishing events, keeping an external database synchronized requires scheduled polling.

### Polling Best Practices
1. **Never Walk Full Post Histories**: Do not query all posts on every poll.
2. **Filter by Channel and Status**: Query only target channels and specific lifecycle states (`status: [sent]` or `status: [error]`).
3. **Sort by `dueAt` or `createdAt`**: Order by `dueAt: desc` to process the most recent items first.
4. **Persist the High-Water Mark (`lastSyncedAt`)**: Store the timestamp of the last processed post in your database and query only posts created or scheduled after that time.
5. **Use Cursor Pagination**: Always inspect `pageInfo.hasNextPage` and pass `after: pageInfo.endCursor` to fetch additional pages safely.

### Polling Sync Worker Example (TypeScript)
```typescript
import { BufferClient } from './client';

export async function pollRecentlySentPosts(params: {
  organizationId: string;
  channelId: string;
  sinceIsoTimestamp: string;
}) {
  const client = new BufferClient();

  const query = `
    query GetRecentSentPosts($input: PostsInput!) {
      posts(input: $input) {
        edges {
          node {
            id
            text
            status
            dueAt
            createdAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const variables = {
    input: {
      organizationId: params.organizationId,
      first: 25,
      filter: {
        channelIds: [params.channelId],
        status: ['sent', 'error'],
      },
      sort: [
        { field: 'dueAt', direction: 'desc' }
      ]
    }
  };

  const data = await client.execute(query, variables);
  const posts = data.posts.edges.map((e: any) => e.node);

  // Filter against our high-water mark timestamp
  const newPosts = posts.filter(
    (p: any) => new Date(p.dueAt || p.createdAt) > new Date(params.sinceIsoTimestamp)
  );

  return newPosts;
}
```
