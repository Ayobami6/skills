---
name: pr-reviewer
description: >-
  Thoroughly reviews pull requests, git diffs, and code changes for correctness,
  security vulnerabilities, edge cases, performance, architecture, test coverage,
  and code readability. Use whenever the user asks to review a PR, review code,
  analyze a git diff, audit changes, or check code before committing or merging.
---

# PR Reviewer Skill

This skill guides you through conducting comprehensive, actionable, and structured pull request (PR) reviews.

---

## Review Workflow

Follow this step-by-step procedure when conducting a review:

### Step 1: Discover and Scope the Changes
- Inspect the commit history and diff using git commands (e.g. `git diff main...HEAD`, `git diff --stat`, `git log -n 5`).
- Determine the scope: Is this a feature, bug fix, refactor, dependency upgrade, or breaking change?
- Identify the blast radius (which services, modules, or database schemas are affected).

### Step 2: Architecture & Design
- **Single Responsibility**: Are modules and functions focused on a single responsibility?
- **Modularity & Reusability**: Are new components appropriately decoupled?
- **Backwards Compatibility**: Do API signature changes or schema changes break existing consumers?
- **Contract & Type Integrity**: Are types, schemas, and interfaces strictly defined without loose casts?

### Step 3: Correctness, Logic & Edge Cases
- **Null / Undefined handling**: Are optional fields, missing parameters, and empty collections safely handled?
- **Error Handling**: Are errors caught, logged with appropriate context, and handled gracefully rather than swallowed?
- **Async & Concurrency**: Are promises/futures awaited properly? Are there race conditions, deadlocks, or unhandled rejections?
- **Boundary Conditions**: Are loops, array indices, off-by-one conditions, and pagination offsets tested properly?

### Step 4: Security Audit
Check against [security_checklist.md](./references/security_checklist.md):
- Injection vulnerabilities (SQL, Command, XSS, Template injection).
- Authentication & Authorization checks.
- Hardcoded secrets, API keys, or sensitive credentials in code or configs.
- Unsanitized inputs and path traversal risks.

### Step 5: Performance & Resource Management
Check against [performance_checklist.md](./references/performance_checklist.md):
- N+1 query patterns or unindexed queries.
- Excessive memory allocations, memory leaks, or unclosed streams/file handles.
- Heavy computations inside loops or render cycles.

### Step 6: Test Coverage & Quality
- Are new/modified execution branches covered by unit or integration tests?
- Do the tests verify edge cases and failure modes, not just the happy path?
- Are tests deterministic (no flaky time/sleep dependencies, mocked network calls)?

---

## Output Format

Always format the review using the standard template in [review_template.md](./references/review_template.md).

### Severity Levels
Categorize all review findings with clear severity tags:
- **`[BLOCKER]`**: Critical bugs, security vulnerabilities, data loss risks, or severe regressions that must be resolved before merging.
- **`[WARNING]`**: Performance concerns, unhandled edge cases, missing test coverage, or architectural design flaws.
- **`[SUGGESTION]`**: Opportunities for refactoring, cleaner syntax, minor optimization, or improved readability.
- **`[NIT]`**: Minor style, naming, or typo improvements (non-blocking).

---

## Code Suggestion Guidelines
When pointing out an issue, always provide:
1. **The Problem**: Clear explanation of why the current code is problematic.
2. **The Context/Location**: Specific file path and line number reference.
3. **The Fix**: A concrete, copy-pasteable code snippet showing the suggested resolution.
