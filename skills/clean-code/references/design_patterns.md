# Software Design Patterns & Architecture Reference

This guide provides practical, modern implementations of essential design patterns and architectural blueprints across modern programming environments.

---

## 1. Creational Patterns

### Factory & Dependency Injection
Decouples client logic from concrete object instantiation, enabling flexible unit testing and runtime polymorphism.

#### Example: Modern DI / Factory in TypeScript
```typescript
export interface PaymentProcessor {
  processPayment(amount: number, currency: string): Promise<PaymentResult>;
}

export class StripeProcessor implements PaymentProcessor {
  constructor(private readonly apiKey: string) {}

  async processPayment(amount: number, currency: string): Promise<PaymentResult> {
    // Concrete Stripe API invocation
    return { success: true, transactionId: `txn_${Date.now()}` };
  }
}

export class PaymentProcessorFactory {
  static create(provider: 'stripe' | 'paypal', config: Config): PaymentProcessor {
    switch (provider) {
      case 'stripe':
        return new StripeProcessor(config.stripeApiKey);
      case 'paypal':
        return new PayPalProcessor(config.paypalClientId);
      default:
        const _exhaustive: never = provider;
        throw new Error(`Unsupported payment provider: ${_exhaustive}`);
    }
  }
}
```

### Builder Pattern
Ideal for constructing complex immutable objects with optional configurations without telescoping constructors.

```typescript
export class HttpRequest {
  readonly url: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: unknown;
  readonly timeoutMs: number;

  private constructor(builder: HttpRequestBuilder) {
    this.url = builder.url;
    this.method = builder.method;
    this.headers = Object.freeze({ ...builder.headers });
    this.body = builder.body;
    this.timeoutMs = builder.timeoutMs;
  }

  static get builder(): (url: string) => HttpRequestBuilder {
    return (url: string) => new HttpRequestBuilder(url);
  }
}

export class HttpRequestBuilder {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET';
  headers: Record<string, string> = {};
  body?: unknown;
  timeoutMs: number = 5000;

  constructor(readonly url: string) {}

  setMethod(method: 'GET' | 'POST' | 'PUT' | 'DELETE'): this {
    this.method = method;
    return this;
  }

  addHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  setBody(body: unknown): this {
    this.body = body;
    return this;
  }

  setTimeout(ms: number): this {
    this.timeoutMs = ms;
    return this;
  }

  build(): HttpRequest {
    if (!this.url) throw new Error('URL must be specified');
    return new (HttpRequest as any)(this);
  }
}
```

---

## 2. Structural Patterns

### Adapter Pattern
Bridges the gap between an incompatible third-party interface and the internal domain model.

```typescript
// Target domain interface
export interface UserDirectory {
  findUserById(id: string): Promise<User | null>;
}

// Adaptee (3rd party legacy service)
class LegacyLdapClient {
  fetchLdapEntry(distinguishedName: string): LegacyEntry { /* ... */ }
}

// Adapter
export class LdapDirectoryAdapter implements UserDirectory {
  constructor(private readonly client: LegacyLdapClient) {}

  async findUserById(id: string): Promise<User | null> {
    const entry = await this.client.fetchLdapEntry(`uid=${id}`);
    if (!entry) return null;
    return {
      id: entry.uid,
      email: entry.mail,
      fullName: `${entry.givenName} ${entry.sn}`,
    };
  }
}
```

### Decorator / Middleware Pattern
Attaches cross-cutting responsibilities (caching, logging, retries, metrics) dynamically without modifying underlying classes.

```typescript
export class CachedUserRepository implements UserRepository {
  constructor(
    private readonly underlying: UserRepository,
    private readonly cache: CacheStore,
    private readonly ttlSeconds: number = 300
  ) {}

  async getUserById(id: string): Promise<User | null> {
    const cached = await this.cache.get<User>(`user:${id}`);
    if (cached) return cached;

    const user = await this.underlying.getUserById(id);
    if (user) {
      await this.cache.set(`user:${id}`, user, this.ttlSeconds);
    }
    return user;
  }
}
```

---

## 3. Behavioral Patterns

### Strategy Pattern
Defines a family of interchangeable algorithms, encapsulating each one behind a common interface.

```python
from abc import ABC, abstractmethod
from typing import List

class CompressionStrategy(ABC):
    @abstractmethod
    def compress(self, data: bytes) -> bytes:
        pass

class GzipCompression(CompressionStrategy):
    def compress(self, data: bytes) -> bytes:
        import gzip
        return gzip.compress(data)

class ZstandardCompression(CompressionStrategy):
    def compress(self, data: bytes) -> bytes:
        import zstandard as zstd
        cctx = zstd.ZstdCompressor(level=3)
        return cctx.compress(data)

class FileArchiver:
    def __init__(self, strategy: CompressionStrategy):
        self._strategy = strategy

    def archive(self, raw_bytes: bytes) -> bytes:
        return self._strategy.compress(raw_bytes)
```

### Observer / Event Emitter (Pub-Sub)
Provides decoupled, one-to-many event notification mechanics.

```typescript
export type EventHandler<T> = (event: T) => void | Promise<void>;

export class EventBus {
  private readonly subscribers = new Map<string, Set<EventHandler<any>>>();

  subscribe<T>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);

    // Unsubscribe callback
    return () => {
      this.subscribers.get(eventType)?.delete(handler);
    };
  }

  async publish<T>(eventType: string, payload: T): Promise<void> {
    const handlers = this.subscribers.get(eventType) ?? [];
    await Promise.all(Array.from(handlers).map((h) => h(payload)));
  }
}
```

---

## 4. Architectural Patterns

### Hexagonal Architecture (Ports & Adapters)
Keeps core business rules strictly decoupled from external drivers (HTTP, CLI, queues) and driven components (Databases, Third-party APIs).

```
   ┌────────────────────────────────────────────────────────┐
   │                       Application                      │
   │                                                        │
   │   Driving Adapters            Driven Adapters          │
   │  ┌────────────────┐         ┌────────────────────┐    │
   │  │  REST Controller│──┐      │ Postgres Repository│    │
   │  └────────────────┘  │      └────────────────────┘    │
   │                      ▼                 ▲              │
   │                ┌──────────┐            │              │
   │                │Use Cases │────────────┤              │
   │                │(Service) │ (Uses Port)│              │
   │                └──────────┘                           │
   │                      │                                │
   │                      ▼                                │
   │                ┌──────────┐                           │
   │                │  Domain  │                           │
   │                │ Entities │                           │
   │                └──────────┘                           │
   └────────────────────────────────────────────────────────┘
```

1. **Domain Layer**: Pure entities, value objects, and domain logic. No framework or ORM imports.
2. **Ports (Interfaces)**: Inbound ports (use cases) and outbound ports (repository/notifier interfaces).
3. **Adapters (Concretions)**: Controllers, database implementations, external HTTP clients.

