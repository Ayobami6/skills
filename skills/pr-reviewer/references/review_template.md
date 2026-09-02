# PR Review Output Template

Use this format when presenting PR review findings to the user or PR author:

```markdown
# 🔍 Pull Request Review

## 📋 Summary of Changes
- **Type**: Feature | Bug Fix | Refactor | Performance | Security | Chore
- **Key Changes**: Brief 2-3 sentence overview of what is introduced or modified.
- **Risk Level**: 🟢 Low | 🟡 Medium | 🔴 High

---

## 🚦 Overall Verdict
- [ ] **APPROVE**: Ready to merge as is.
- [ ] **APPROVE WITH SUGGESTIONS**: Non-blocking improvements recommended.
- [ ] **REQUEST CHANGES**: Critical blockers or regressions must be fixed before merge.

---

## 🚨 Critical & Major Findings

### [BLOCKER] Issue Title
- **Location**: `path/to/file.ext#L12-L18`
- **Description**: Detailed explanation of the bug, security issue, or breaking change.
- **Suggested Fix**:
```diff
- problematic_line();
+ safe_replacement_line();
```

---

## 💡 Suggestions & Improvements

### [SUGGESTION] Optimization / Readability Improvement
- **Location**: `path/to/file.ext#L45`
- **Description**: Recommendation for cleaner code, better typing, or performance improvement.
- **Suggested Code**:
```typescript
// Proposed snippet
```

---

## 🧹 Nits & Style (Non-Blocking)
- `path/to/file.ext#L8`: Typo in comment (`reciever` -> `receiver`).
- `path/to/file.ext#L33`: Variable name `d` could be renamed to `durationMs` for readability.

---

## 🧪 Testing & Verification Notes
- [ ] Unit tests added / updated.
- [ ] Edge cases verified (e.g. null inputs, timeouts, empty lists).
```
