---
name: pr-reviewer
description: >-
  Thoroughly reviews pull requests, git diffs, and code changes for correctness,
  security vulnerabilities, edge cases, performance, architecture, test coverage,
  and code readability. Supports checking open GitHub PRs and submitting reviews
  (approvals, comments, requested changes, and inline comments) directly using GitHub MCP tools.
  Use whenever the user asks to review a PR, check open PRs, audit a diff, or submit a code review.
---

# PR Reviewer Skill

This skill guides you through finding open pull requests, reviewing code changes comprehensively, and submitting structured reviews directly to GitHub via GitHub MCP tools or local git.

---

## Capabilities & Modes

This skill supports two primary review modes:
1. **GitHub MCP Mode**: Interacting with remote GitHub repositories to find open PRs, fetch diffs, and publish reviews (with inline comments and approval/change-request events).
2. **Local Git Mode**: Inspecting local git branches, working tree diffs, and pre-commit changes.

---

## Workflow with GitHub MCP Tools

When interacting with a remote GitHub repository (`github-mcp-server` or `remote-github`), follow this automated flow:

### 1. Check for Open Pull Requests
- **List repository PRs**: Call `list_pull_requests` with `owner`, `repo`, `state: "open"`, `sort: "updated"`, `direction: "desc"`.
- **Search PRs requested for review**: Call `search_pull_requests` with queries like `is:pr is:open review-requested:@me repo:owner/repo`.

### 2. Retrieve PR Details & Diff
- **PR Metadata**: Call `pull_request_read` with `method: "get"`, `owner`, `repo`, `pullNumber`.
- **Changed Files**: Call `pull_request_read` with `method: "get_files"`, `owner`, `repo`, `pullNumber`.
- **Diff Contents**: Call `pull_request_read` with `method: "get_diff"`, `owner`, `repo`, `pullNumber`.
- **CI / Check Runs Status**: Call `pull_request_read` with `method: "get_check_runs"`, `owner`, `repo`, `pullNumber`.

### 3. Conduct the In-Depth Review
Follow the review criteria:
- **Architecture & Design**: Separation of concerns, interface contracts, backward compatibility.
- **Correctness & Edge Cases**: Nil/null safety, off-by-one errors, error propagation, async race conditions.
- **Security**: Refer to [security_checklist.md](./references/security_checklist.md).
- **Performance**: Refer to [performance_checklist.md](./references/performance_checklist.md).
- **Tests**: Verify branch coverage, mock boundaries, test determinism.

### 4. Submit the Review to GitHub

Choose between a single-submission review or an inline-comment review:

#### A. Single Review Submission (Summary + Findings)
Call `pull_request_review_write`:
- `method`: `"create"`
- `owner`: `<owner>`
- `repo`: `<repo>`
- `pullNumber`: `<pullNumber>`
- `event`: `"APPROVE"` | `"REQUEST_CHANGES"` | `"COMMENT"`
- `body`: Markdown review formatted according to [review_template.md](./references/review_template.md).

#### B. Review with Line-Specific Inline Comments
1. **Create Pending Review**:
   Call `pull_request_review_write` with `method: "create"`, `owner`, `repo`, `pullNumber` (omit `event` so it remains pending).
2. **Add Inline Comments**:
   Call `add_comment_to_pending_review` for each line-specific finding:
   - `path`: File relative path (e.g. `src/auth.ts`)
   - `line`: Line number in the new diff
   - `side`: `"RIGHT"`
   - `subjectType`: `"LINE"`
   - `body`: Explanation with suggested code fix.
3. **Submit Pending Review**:
   Call `pull_request_review_write` with:
   - `method`: `"submit_pending"`
   - `owner`, `repo`, `pullNumber`
   - `event`: `"APPROVE"` | `"REQUEST_CHANGES"` | `"COMMENT"`
   - `body`: Summary overview of the review.

> See [github_mcp_integration.md](./references/github_mcp_integration.md) for full tool parameter details and examples.

---

## Local Review Workflow (Git CLI)

When reviewing local changes before commit or push:
1. Inspect diffs: `git diff main...HEAD` or `git diff --staged`.
2. Inspect log: `git log -n 5 --stat`.
3. Format feedback using [review_template.md](./references/review_template.md).

---

## Severity Categorization

- **`[BLOCKER]`**: Critical bugs, security vulnerabilities, breaking API changes, or data loss risks. (Use `event: "REQUEST_CHANGES"` on GitHub).
- **`[WARNING]`**: Performance bottlenecks, missing tests, unhandled edge cases. (Use `event: "COMMENT"` or `"REQUEST_CHANGES"` depending on severity).
- **`[SUGGESTION]`**: Code cleanup, refactoring, ergonomics. (Use `event: "APPROVE"` or `"COMMENT"`).
- **`[NIT]`**: Minor style, typos, formatting (non-blocking).
