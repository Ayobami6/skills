# Performance Checklist for PR Reviews

When evaluating code for performance regressions and resource efficiency, check the following:

## 1. Database & Queries
- [ ] **N+1 Queries**: Ensure associations/relations are eager-loaded (e.g. `JOIN`, `select_related`, `prefetch_related`) rather than queried inside loops.
- [ ] **Indexes**: New query filter conditions (`WHERE`), join keys, and sorting fields (`ORDER BY`) are supported by appropriate database indexes.
- [ ] **Pagination & Limits**: Queries that fetch list data enforce reasonable limits/pagination to prevent full-table loads into memory.
- [ ] **Unnecessary Columns**: Queries only select required fields rather than `SELECT *` on wide tables.

## 2. Memory & Resource Management
- [ ] **Resource Cleanup**: Open file handles, network sockets, DB connections, and streams are closed or wrapped in context managers (`with`, `try...finally`, `using`).
- [ ] **Event Listeners / Subscriptions**: Observers, listeners, intervals, and timeouts are properly cleaned up on unmount/lifecycle end.
- [ ] **Large Payloads / Buffers**: Avoid loading entire large files (e.g. multi-GB CSVs or images) into memory at once; use streaming/chunking.

## 3. Algorithmic Complexity & Loops
- [ ] No nested loops yielding \(O(n^2)\) or worse when lookup sets or hash maps (\(O(1)\)) can be used.
- [ ] Expensive computations, regex compilations, or DOM queries are not executed repeatedly inside tight loops.

## 4. Concurrency & Asynchronous Operations
- [ ] Independent async tasks are executed concurrently (e.g., `Promise.all`, `asyncio.gather`) instead of sequentially awaiting in series.
- [ ] Locks, mutexes, or atomic transactions are used where race conditions could corrupt shared state.

## 5. Frontend & UI (if applicable)
- [ ] Avoid redundant re-renders or unmemoized expensive calculations (`useMemo`, `useCallback`, `React.memo`).
- [ ] Asset bundle impact: Large third-party libraries are not imported when lightweight alternatives or tree-shaking exist.

