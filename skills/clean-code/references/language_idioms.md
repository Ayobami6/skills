# Language-Specific Idioms & Best Practices

Write code that aligns with the paradigms and community conventions of each runtime.

---

## 1. TypeScript & JavaScript

1. **Strict Type Safety**:
   - Never use `any`. Use `unknown` with type narrowing / type guards.
   - Enable `strict: true`, `noImplicitReturns`, `noUncheckedIndexedAccess` in `tsconfig.json`.
2. **Discriminated Unions for State**:
   ```typescript
   type FetchState<T> =
     | { status: 'idle' }
     | { status: 'loading' }
     | { status: 'success'; data: T }
     | { status: 'error'; error: Error };
   ```
3. **Immutability by Default**:
   - Use `readonly`, `ReadonlyArray<T>`, and `Object.freeze()`.
   - Prefer spread operators or pure array methods (`map`, `filter`, `reduce`, `toSorted`) over mutating ones (`splice`, `sort`).
4. **Async & Concurrency**:
   - Always await promises or return them explicitly.
   - Use `Promise.allSettled` when executing independent tasks where one failure shouldn't abort all others.

---

## 2. Python

1. **PEP 8 & Type Hints**:
   - Annotate all functions with strict type hints (`from typing import Optional, List, Dict, Protocol`).
   - Run `mypy` or `pyright` in strict mode.
2. **Dataclasses & Pydantic**:
   ```python
   from dataclasses import dataclass

   @dataclass(frozen=True, slots=True)
   class UserProfile:
       user_id: str
       display_name: str
       email: str
   ```
3. **Pythonic Constructs**:
   - Use context managers (`with`) for file and lock handling.
   - Use generators (`yield`) for processing large streaming datasets to keep memory footprint $O(1)$.
   - Use dict/set/list comprehensions instead of imperative accumulator loops.

---

## 3. Go

1. **Explicit Error Handling**:
   - Return errors as the last return value: `func DoSomething() (Result, error)`.
   - Wrap errors with context: `fmt.Errorf("failed to load user config: %w", err)`.
2. **Interface Design**:
   - "Accept interfaces, return structs".
   - Keep interfaces tiny (1-2 methods). Define interfaces in the consumer package, not the producer.
3. **Goroutines & Concurrency**:
   - Always manage goroutine lifecycles (pass `context.Context` for timeouts/cancellations).
   - Guard shared state with `sync.Mutex` or `sync.RWMutex`, or use channels for communication.
   - Avoid goroutine leaks by ensuring channel readers/writers never block indefinitely.

---

## 4. Rust

1. **Ownership & Lifetimes**:
   - Prefer borrowing (`&T`, `&str`) over cloning (`.clone()`) unless transfer of ownership is required.
   - Leverage `Rc`/`Arc` and `RefCell`/`RwLock` only when multi-ownership is strictly required.
2. **Error Handling with `Result` and `Option`**:
   - Use the `?` operator for clean error bubbling.
   - Use combinators like `.map()`, `.and_then()`, `.unwrap_or_else()`.
   - Use `thiserror` for library error types and `anyhow` for application binaries.
3. **Traits & Zero-Cost Abstractions**:
   - Implement `std::fmt::Display`, `std::fmt::Debug`, and `From<Source>` / `TryFrom<Source>`.
   - Prefer generics with trait bounds over dynamic dispatch (`dyn Trait`) when possible.

---

## 5. Java & Kotlin

1. **Java Modern Features**:
   - Use `record` for immutable data carriers.
   - Use `Optional<T>` for return values that may be absent (never pass `Optional` as method arguments).
   - Use Pattern Matching for `switch` and `instanceof`.
2. **Kotlin Idioms**:
   - Leverage data classes, null safety (`?.`, `?:`), and `sealed class`/`sealed interface` for algebraic data types.
   - Use coroutines and `Flow` for reactive, non-blocking asynchronous programming.

