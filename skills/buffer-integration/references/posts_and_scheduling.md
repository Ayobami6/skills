# Buffer Posts & Scheduling Guide

This guide covers creating, scheduling, modifying, and deleting social media posts across networks using the Buffer GraphQL API (`https://api.buffer.com`).

---

## 1. Creating Posts (`createPost`)

The `createPost` mutation is the central entry point for scheduling content, drafting, or publishing immediately.

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess {
      post {
        id
        text
        status
        dueAt
        channelId
        assets {
          id
          url
          mimeType
        }
      }
    }
    ... on MutationError {
      message
    }
  }
}
```

---

## 2. Scheduling Modes (`ShareMode`)

Buffer provides four distinct modes for placing content into publishing schedules:

| Mode | Behavior | Required Fields |
| :--- | :--- | :--- |
| **`addToQueue`** | Adds post to the next open slot in the channel's recurring posting schedule | `channelId`, `schedulingType`, `mode: addToQueue` |
| **`customScheduled`** | Schedules post for an exact calendar time | `channelId`, `schedulingType`, `mode: customScheduled`, **`dueAt`** |
| **`shareNow`** | Publishes the post immediately to the social network | `channelId`, `schedulingType: automatic`, `mode: shareNow` |
| **`shareNext`** | Places post at the top of the queue (will be published at the next upcoming slot) | `channelId`, `schedulingType`, `mode: shareNext` |

### Timestamp Rules for `dueAt`
When using `mode: customScheduled`, the `dueAt` parameter must:
- Be a valid ISO 8601 UTC string (e.g. `2026-11-20T15:30:00.000Z`).
- Be set in the future (past timestamps will be rejected with a `MutationError`).

---

## 3. Scheduling Types (`SchedulingType`)

- **`automatic`**: Default for business profiles. Buffer dispatches the post directly to the social network API without manual intervention.
- **`notification`**: Buffer sends a mobile push notification to team members when it is time to publish. Required for personal Instagram accounts, personal TikTok accounts without direct publishing permissions, or manual review workflows.

---

## 4. Media Assets & Attachments

To attach media to posts, pass an array of media objects in `assets`:

```json
{
  "assets": [
    {
      "url": "https://cdn.example.com/assets/announcement.jpg",
      "mimeType": "image/jpeg"
    }
  ]
}
```

### Media Guidelines
- **Public URLs**: Every media URL must be accessible over public HTTPS without password or authentication protection.
- **Supported Formats**:
  - Images: JPEG, PNG, GIF, WebP.
  - Videos: MP4, MOV (H.264 or HEVC codecs).
  - Documents: PDF (supported on LinkedIn for carousel presentations).
- **Mutual Exclusivity Rule**: If you provide file attachments in `assets`, do not provide link attachments in network metadata, as social platforms typically reject posts with conflicting attachment types.

---

## 5. Editing Posts (`editPost`)

Modify copy, reschedule a post, or update media assets:

```graphql
mutation EditPost($input: EditPostInput!) {
  editPost(input: $input) {
    ... on PostActionSuccess {
      post {
        id
        text
        dueAt
        status
      }
    }
    ... on MutationError {
      message
    }
  }
}
```

**Variables**:
```json
{
  "input": {
    "id": "post_100293",
    "text": "Updated post text with revised link: https://example.com/updated",
    "dueAt": "2026-11-22T18:00:00.000Z"
  }
}
```

---

## 6. Deleting Posts (`deletePost`)

Remove a post from your queue or drafts permanently:

```graphql
mutation DeletePost($input: DeletePostInput!) {
  deletePost(input: $input) {
    ... on DeletePostSuccess {
      id
    }
    ... on MutationError {
      message
    }
  }
}
```

**Variables**:
```json
{
  "input": {
    "id": "post_100293"
  }
}
```

---

## 7. Querying Posts (`posts`)

Retrieve sent or scheduled posts with cursor-based pagination and status filtering:

```graphql
query GetScheduledPosts($input: PostsInput!) {
  posts(input: $input) {
    edges {
      cursor
      node {
        id
        text
        status
        dueAt
        createdAt
        assets {
          url
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Variables**:
```json
{
  "input": {
    "organizationId": "org_99214b7e",
    "first": 15,
    "filter": {
      "channelIds": ["ch_insta_101"],
      "status": [scheduled]
    },
    "sort": [
      { "field": dueAt, "direction": asc }
    ]
  }
}
```

---

## 8. Multi-Language Implementations

### TypeScript / Node.js
```typescript
import { BufferClient } from './client';

export async function scheduleSocialPost(params: {
  channelId: string;
  text: string;
  scheduledTime?: string; // ISO 8601 string
  imageUrl?: string;
}) {
  const client = new BufferClient();

  const mode = params.scheduledTime ? 'customScheduled' : 'addToQueue';
  const assets = params.imageUrl
    ? [{ url: params.imageUrl, mimeType: 'image/jpeg' }]
    : [];

  const mutation = `
    mutation Schedule($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess {
          post {
            id
            text
            dueAt
            status
          }
        }
        ... on MutationError {
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      channelId: params.channelId,
      text: params.text,
      schedulingType: 'automatic',
      mode,
      dueAt: params.scheduledTime,
      assets: assets.length > 0 ? assets : undefined,
    },
  };

  const result = await client.execute(mutation, variables);
  if (result.createPost.message) {
    throw new Error(`Buffer Post Creation Failed: ${result.createPost.message}`);
  }

  return result.createPost.post;
}
```

### Python
```python
from typing import Optional
from .client import BufferClient

def create_social_post(
    client: BufferClient,
    channel_id: str,
    text: str,
    due_at: Optional[str] = None,
    image_url: Optional[str] = None,
) -> dict:
    mode = "customScheduled" if due_at else "addToQueue"
    assets = [{"url": image_url, "mimeType": "image/jpeg"}] if image_url else []

    mutation = """
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess {
          post {
            id
            text
            status
            dueAt
          }
        }
        ... on MutationError {
          message
        }
      }
    }
    """

    payload = {
        "channelId": channel_id,
        "text": text,
        "schedulingType": "automatic",
        "mode": mode,
    }
    if due_at:
        payload["dueAt"] = due_at
    if assets:
        payload["assets"] = assets

    data = client.execute(mutation, {"input": payload})
    result = data.get("createPost", {})
    if "message" in result:
        raise ValueError(f"Buffer API Error: {result['message']}")

    return result.get("post", {})
```
