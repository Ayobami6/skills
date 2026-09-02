# GitHub MCP Server Integration Reference

This guide details the exact MCP tools used to discover open PRs, inspect diffs, and publish reviews using `github-mcp-server` or `remote-github`.

---

## 1. Finding Open Pull Requests

### Tool: `list_pull_requests`
Lists pull requests in a repository with flexible filtering and sorting.

```json
{
  "ServerName": "github-mcp-server",
  "ToolName": "list_pull_requests",
  "Arguments": {
    "owner": "Ayobami6",
    "repo": "my-project",
    "state": "open",
    "sort": "updated",
    "direction": "desc",
    "perPage": 10
  }
}
```

### Tool: `search_pull_requests`
Searches PRs using GitHub search syntax (e.g. for PRs assigned to a specific user or requesting review).

```json
{
  "ServerName": "github-mcp-server",
  "ToolName": "search_pull_requests",
  "Arguments": {
    "query": "repo:Ayobami6/my-project is:pr is:open review-requested:@me"
  }
}
```

---

## 2. Inspecting PR Details & Diffs

### Tool: `pull_request_read`
Supports multiple retrieval methods:

#### A. Fetch Metadata & Summary
```json
{
  "ServerName": "github-mcp-server",
  "ToolName": "pull_request_read",
  "Arguments": {
    "owner": "Ayobami6",
    "repo": "my-project",
    "pullNumber": 42,
    "method": "get"
  }
}
```

#### B. Fetch Changed Files List
```json
{
  "ServerName": "github-mcp-server",
  "ToolName": "pull_request_read",
  "Arguments": {
    "owner": "Ayobami6",
    "repo": "my-project",
    "pullNumber": 42,
    "method": "get_files"
  }
}
```

#### C. Fetch Full Diff
```json
{
  "ServerName": "github-mcp-server",
  "ToolName": "pull_request_read",
  "Arguments": {
    "owner": "Ayobami6",
    "repo": "my-project",
    "pullNumber": 42,
    "method": "get_diff"
  }
}
```

#### D. Fetch CI/Check Runs
```json
{
  "ServerName": "github-mcp-server",
  "ToolName": "pull_request_read",
  "Arguments": {
    "owner": "Ayobami6",
    "repo": "my-project",
    "pullNumber": 42,
    "method": "get_check_runs"
  }
}
```

---

## 3. Submitting PR Reviews

### Method A: Single Overall Review

#### Tool: `pull_request_review_write`
Submit a complete review directly in one tool call.

```json
{
  "ServerName": "github-mcp-server",
  "ToolName": "pull_request_review_write",
  "Arguments": {
    "owner": "Ayobami6",
    "repo": "my-project",
    "pullNumber": 42,
    "method": "create",
    "event": "APPROVE", 
    "body": "### PR Review Summary\n\n- Architecture looks solid.\n- Tests pass.\n- No security concerns identified."
  }
}
```
> Supported `event` values: `"APPROVE"`, `"REQUEST_CHANGES"`, `"COMMENT"`.

---

### Method B: Review with Multi-Line & Inline Comments

When you need to attach comments directly to lines of code before submitting the review:

#### Step 1: Start a Pending Review
```json
{
  "ServerName": "github-mcp-server",
  "ToolName": "pull_request_review_write",
  "Arguments": {
    "owner": "Ayobami6",
    "repo": "my-project",
    "pullNumber": 42,
    "method": "create"
  }
}
```
*(Omitting `event` creates a draft/pending review)*.

#### Step 2: Add Line Comment(s)
#### Tool: `add_comment_to_pending_review`
```json
{
  "ServerName": "github-mcp-server",
  "ToolName": "add_comment_to_pending_review",
  "Arguments": {
    "owner": "Ayobami6",
    "repo": "my-project",
    "pullNumber": 42,
    "path": "src/services/auth.ts",
    "subjectType": "LINE",
    "side": "RIGHT",
    "line": 45,
    "body": "**[BLOCKER] Missing input validation**: Ensure `userId` is sanitized before passing to query.\n```ts\n+ const sanitizedId = sanitizeInput(userId);\n```"
  }
}
```

#### Step 3: Submit the Pending Review
```json
{
  "ServerName": "github-mcp-server",
  "ToolName": "pull_request_review_write",
  "Arguments": {
    "owner": "Ayobami6",
    "repo": "my-project",
    "pullNumber": 42,
    "method": "submit_pending",
    "event": "REQUEST_CHANGES",
    "body": "Reviewed changes. Found 1 critical security issue in `auth.ts` that needs resolution before merging."
  }
}
```

---

## 4. Replying to Existing Review Threads

### Tool: `add_reply_to_pull_request_comment`
```json
{
  "ServerName": "github-mcp-server",
  "ToolName": "add_reply_to_pull_request_comment",
  "Arguments": {
    "owner": "Ayobami6",
    "repo": "my-project",
    "pullNumber": 42,
    "commentId": 12345678,
    "body": "Verified the fix in the latest commit."
  }
}
```
