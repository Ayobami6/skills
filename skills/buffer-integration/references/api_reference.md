# Buffer GraphQL API Reference Guide

Complete reference for the Buffer public GraphQL API (`https://api.buffer.com`).

---

## 1. Endpoint & Headers

Buffer operates a unified GraphQL API. All queries and mutations are dispatched to a single endpoint via HTTP `POST`.

- **Endpoint**: `https://api.buffer.com`
- **Method**: `POST`

### Required Request Headers
```http
Authorization: Bearer YOUR_BUFFER_API_KEY
Content-Type: application/json
Accept: application/json
```

### Request Envelope
```json
{
  "query": "query GetAccount { account { id name } }",
  "variables": {}
}
```

---

## 2. Queries

### `account`
Fetches the authenticated user's account details, billing tier, and associated organizations.

```graphql
query GetAccount {
  account {
    id
    name
    email
    createdAt
    organizations {
      id
      name
      isOwner
      role
      plan
      channelLimit
    }
  }
}
```

### `channels`
Retrieves social media channels connected to a specific organization.

```graphql
query GetChannels($input: ChannelsInput!) {
  channels(input: $input) {
    id
    name
    displayName
    service
    serviceType
    avatar
    isQueuePaused
    createdAt
    timezone
    organizationId
  }
}
```
**Variables**:
```json
{
  "input": {
    "organizationId": "org_55a109"
  }
}
```

### `posts`
Retrieves posts for an organization with filtering, sorting, and cursor-based pagination.

```graphql
query GetPosts($input: PostsInput!) {
  posts(input: $input) {
    edges {
      cursor
      node {
        id
        text
        status
        channelId
        dueAt
        createdAt
        updatedAt
        assets {
          id
          url
          mimeType
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```
**Variables**:
```json
{
  "input": {
    "organizationId": "org_55a109",
    "first": 20,
    "filter": {
      "channelIds": ["ch_88291a"],
      "status": [scheduled, sent]
    },
    "sort": [
      { "field": dueAt, "direction": desc }
    ]
  }
}
```

### `post`
Retrieves a single post by ID along with social performance metrics.

```graphql
query GetPost($input: PostInput!) {
  post(input: $input) {
    id
    text
    status
    channelId
    dueAt
    createdAt
    metrics {
      type
      name
      value
      unit
    }
    metricsUpdatedAt
  }
}
```
**Variables**:
```json
{
  "input": {
    "id": "post_77182a"
  }
}
```

### `ideas`
Retrieves organization-level brainstorms and draft ideas.

```graphql
query GetIdeas($input: IdeasInput!) {
  ideas(input: $input) {
    edges {
      node {
        id
        content {
          title
          text
        }
        createdAt
        updatedAt
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

---

## 3. Mutations

### `createPost`
Creates and schedules a new post, drafts content, or publishes immediately.

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
        }
      }
    }
    ... on MutationError {
      message
    }
  }
}
```

#### `CreatePostInput` Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `channelId` | `ChannelId!` | **Yes** | ID of the target connected channel |
| `text` | `String` | No | Post caption / copy text |
| `schedulingType` | `SchedulingType!` | **Yes** | `automatic` or `notification` |
| `mode` | `ShareMode!` | **Yes** | `addToQueue`, `customScheduled`, `shareNow`, `shareNext` |
| `dueAt` | `DateTime` | Conditional | Required when `mode: customScheduled`. ISO 8601 UTC string |
| `saveToDraft` | `Boolean` | No | If `true`, saves post as draft without scheduling |
| `assets` | `[AssetInput!]` | No | Ordered list of media attachments |
| `metadata` | `PostInputMetaData` | No | Platform-specific parameters (e.g., Instagram Reels) |

### `editPost`
Updates text, assets, schedule, or draft status of an existing post.

```graphql
mutation EditPost($input: EditPostInput!) {
  editPost(input: $input) {
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
```

#### `EditPostInput` Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `PostId!` | **Yes** | The unique ID of the post to update |
| `text` | `String` | No | Updated post copy |
| `dueAt` | `DateTime` | No | Updated publication date |
| `mode` | `ShareMode` | No | Updated scheduling mode |
| `assets` | `[AssetInput!]` | No | Replacement media list (empty array clears assets) |
| `metadata` | `PostInputMetaData` | No | Updated platform metadata |
| `saveToDraft` | `Boolean` | No | Move between draft and scheduled states |

### `deletePost`
Permanently deletes a scheduled, draft, or sent post record.

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

### `createIdea`
Creates a new brainstorm idea at the organization level.

```graphql
mutation CreateIdea($input: CreateIdeaInput!) {
  createIdea(input: $input) {
    ... on Idea {
      id
      content {
        title
        text
      }
      createdAt
    }
    ... on MutationError {
      message
    }
  }
}
```

---

## 4. Key Enums & Input Types

### `ShareMode`
- `addToQueue`: Appends post to the channel's standard queue schedule.
- `customScheduled`: Requires `dueAt` to publish at an exact calendar time.
- `shareNow`: Immediately publishes to the destination social network.
- `shareNext`: Inserts post at the front of the queue.

### `SchedulingType`
- `automatic`: Buffer publishes directly via network API.
- `notification`: Buffer sends a push reminder to the user's mobile app.

### `PostStatus`
- `draft`: Unscheduled work-in-progress draft.
- `scheduled`: Queued or custom scheduled for future delivery.
- `sent`: Successfully delivered to destination network.
- `error`: Failed during publication attempt.

### `PostType` (Instagram / Video Metadata)
- `post`: Standard image or carousel post.
- `reel`: Short-form vertical video reel.
- `story`: Ephemeral 24-hour story.

### `AssetInput`
```graphql
input AssetInput {
  url: String!
  mimeType: String
  image: ImageAssetInput
  video: VideoAssetInput
}
```

---

## 5. GraphQL Error Handling & Status Codes

Unlike REST APIs that return 4xx/5xx for operational errors, Buffer returns HTTP `200 OK` for most GraphQL execution errors, presenting errors in two ways:

1. **Top-Level `errors` Array**:
   Syntax errors, missing variables, authentication failures, or bad queries:
   ```json
   {
     "errors": [
       {
         "message": "Variable \"$input\" got invalid value",
         "locations": [{ "line": 2, "column": 23 }]
       }
     ]
   }
   ```
2. **Schema-Level `MutationError` Union**:
   Domain and business validation errors (e.g. invalid date, platform character limit exceeded, missing channel):
   ```json
   {
     "data": {
       "createPost": {
         "message": "Channel not found or insufficient permissions"
       }
     }
   }
   ```
3. **HTTP `429 Too Many Requests`**:
   Triggered when rate limits are exceeded. Accompanied by standard `Retry-After` header.
