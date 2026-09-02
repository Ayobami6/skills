# Defensive Programming & Error Handling Reference

Defensive programming guarantees that software continues to function predictably under unexpected inputs, external failures, concurrency contention, and boundary violations.

---

## 1. Explicit Error Handling & Result Types

Instead of throwing untyped exceptions for predictable domain errors, prefer explicit Result types or error values.

### TypeScript / Rust Result Pattern
```typescript
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Usage
export class InsufficientFundsError extends Error {
  readonly code = 'INSUFFICIENT_FUNDS';
}

export function withdraw(balance: number, amount: number): Result<number, InsufficientFundsError> {
  if (amount <= 0) {
    return Err(new Error('Withdrawal amount must be positive') as any);
  }
  if (amount > balance) {
    return Err(new InsufficientFundsError(`Cannot withdraw ${amount} from balance ${balance}`));
  }
  return Ok(balance - amount);
}
```

---

## 2. Guard Clauses & Fail-Fast Validation

Always validate function preconditions immediately at the start of execution. Avoid deeply nested `if/else` ladders.

### Bad (Deeply Nested)
```python
def process_order(user, cart, payment_info):
    if user is not None:
        if user.is_active:
            if cart and len(cart.items) > 0:
                if payment_info.is_valid:
                    # Deeply nested actual work
                    return execute_order(user, cart, payment_info)
                else:
                    raise InvalidPaymentError()
            else:
                raise EmptyCartError()
        else:
            raise InactiveUserError()
    else:
        raise UnauthenticatedError()
```

### Good (Guard Clauses)
```python
def process_order(user, cart, payment_info):
    if user is None:
        raise UnauthenticatedError("User must be authenticated.")
    if not user.is_active:
        raise InactiveUserError("User account is disabled.")
    if not cart or not cart.items:
        raise EmptyCartError("Cannot checkout with an empty cart.")
    if not payment_info.is_valid:
        raise InvalidPaymentError("Payment verification failed.")

    # Core execution is flat and obvious
    return execute_order(user, cart, payment_info)
```

---

## 3. Resource Management & Deterministic Cleanup

Always guarantee that opened handles (file descriptors, sockets, database transactions, mutexes) are released regardless of errors.

| Language | Guaranteed Cleanup Mechanism |
| :--- | :--- |
| **Go** | `defer file.Close()` immediately after checking `err == nil` |
| **Python** | Context managers: `with open(...) as f:` or `@contextmanager` |
| **TypeScript / JS** | `try ... finally { handle.release(); }` or `using` keyword (TS 5.2+) |
| **Rust** | RAII (`Drop` trait handles automatic release when out of scope) |
| **Java** | `try-with-resources`: `try (var connection = pool.getConnection()) { ... }` |

---

## 4. Concurrency & Race Condition Prevention

1. **Avoid Shared Mutable State**: Favor message passing (channels/queues) or immutability.
2. **Atomic Operations**: Use atomic counters/flags for simple concurrent primitives.
3. **Timeouts & Context Propagation**: Always accept a cancellation context or timeout for network/IO operations.

### Go: Context Propagation Example
```go
func FetchDataWithTimeout(ctx context.Context, url string, timeout time.Duration) ([]byte, error) {
    ctx, cancel := context.WithTimeout(ctx, timeout)
    defer cancel()

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("http request failed: %w", err)
    }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}
```

---

## 5. Defensive Input Sanitization & Boundaries

- Never trust raw incoming data (HTTP bodies, query parameters, CLI arguments, environment variables).
- Parse and validate at the boundary using schema validators (e.g. Zod, Pydantic, Marshmallow, validator).
- Convert raw inputs into validated domain types immediately upon ingestion.

