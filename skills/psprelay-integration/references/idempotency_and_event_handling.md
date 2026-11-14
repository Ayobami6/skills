# Idempotency & Event Handling Guide

This guide covers building reliable, idempotent downstream webhook receivers for **PSP Relay**, ensuring your services handle at-least-once delivery without duplicate financial transactions.

---

## 1. At-Least-Once Delivery Semantics

PSP Relay guarantees **at-least-once delivery**. A downstream service may receive the same webhook event more than once due to:
1. **Network Timeouts**: The downstream endpoint took longer than 5 seconds to respond, causing PSP Relay's HTTP client to abort and retry.
2. **Kafka Consumer Rebalancing**: A consumer group rebalance occurs during event processing.
3. **Manual Operator Replay**: An operator triggers a replay via the PSP Relay Management Console (`/admin`) or Replay API.

### Key Rule
> Downstream handlers must be **strictly idempotent**. Receiving an identical webhook multiple times must produce the exact same system state as receiving it once.

---

## 2. Idempotency Key (`X-PSPRelay-Event-ID`)

Every relayed event carries an `X-PSPRelay-Event-ID` header containing a durable, globally unique UUID assigned by PSP Relay when the event was first ingested.

### Database Deduplication Table Pattern (PostgreSQL)

```sql
CREATE TABLE processed_relay_events (
    event_id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(32) NOT NULL,
    payment_reference VARCHAR(128),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload JSONB NOT NULL
);

CREATE INDEX idx_processed_relay_reference ON processed_relay_events(payment_reference);
```

### Idempotent Upsert Logic (Atomic Insert)
Using an atomic `INSERT ... ON CONFLICT DO NOTHING` guarantees that concurrent or repeated requests for the same event ID are safely deduplicated at the database storage engine layer:

```sql
INSERT INTO processed_relay_events (event_id, provider, payment_reference, payload)
VALUES ($1, $2, $3, $4)
ON CONFLICT (event_id) DO NOTHING;
```

If zero rows were affected, the event has already been received: return `HTTP 200 OK` immediately.

---

## 3. Fast 2xx Acknowledgment (< 5 Seconds)

PSP Relay enforces a **5-second timeout** on outbound HTTP deliveries. If your endpoint does not complete the request within 5 seconds, PSP Relay marks the delivery as failed, logs a failure, and schedules a retry.

### Why You Must Offload Work
Fulfilling orders often requires:
- Database transactions with row-level locking (`SELECT ... FOR UPDATE`).
- Generating and emailing PDF invoices.
- Invoking third-party APIs (ERP, CRM, Slack notifications).

These operations easily exceed 5 seconds under network jitter or load spikes.

### The Correct Pattern
1. **Synchronous (Fast, < 50ms)**: Validate signature $\to$ insert event into `processed_relay_events` $\to$ enqueue background job $\to$ return `200 OK`.
2. **Asynchronous (Background Worker)**: Background worker picks up job $\to$ credits customer balance $\to$ dispatches emails $\to$ marks order complete.

---

## 4. Handling Retries (`X-PSPRelay-Retry-Attempt`)

When a delivery fails, PSP Relay's `RetryWorker` automatically attempts re-delivery up to **3 times** using exponential backoff with jitter (e.g. ~10s, ~30s, ~90s).

On retries, PSP Relay includes the header:
```http
X-PSPRelay-Retry-Attempt: 1
```

### Telemetry & Alerting
- If your logs show `X-PSPRelay-Retry-Attempt: 2` or `3`, check downstream endpoint latency to verify handlers are not hitting the 5-second timeout ceiling.
- Do not reject requests simply because the retry attempt is $> 0$. Process normally after checking your idempotency table.

---

## 5. End-to-End Implementation Example (TypeScript / BullMQ)

```typescript
import express, { Request, Response } from 'express';
import crypto from 'node:crypto';
import { Queue } from 'bullmq';
import { pool } from './db';

const app = express();
const SIGNATURE_KEY = process.env.PSP_RELAY_SIGNATURE_KEY!;
const paymentQueue = new Queue('payment_fulfillment', {
  connection: { host: 'redis', port: 6379 }
});

app.post('/v1/webhooks/psp', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const rawBody = req.body as Buffer;
  const signature = req.header('X-PSPRelay-Signature');
  const eventId = req.header('X-PSPRelay-Event-ID');
  const provider = req.header('X-PSP-Provider');
  const retryAttempt = req.header('X-PSPRelay-Retry-Attempt') || '0';

  // 1. Signature Verification
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const expectedSig = crypto
    .createHmac('sha256', SIGNATURE_KEY)
    .update(rawBody)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature.toLowerCase()), Buffer.from(expectedSig.toLowerCase()))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Idempotency Check with Database Lock
  if (!eventId) {
    return res.status(400).json({ error: 'Missing event ID' });
  }

  const payload = JSON.parse(rawBody.toString('utf-8'));
  const reference = payload.data?.reference || payload.data?.tx_ref || payload.eventData?.paymentReference;

  const insertResult = await pool.query(
    `INSERT INTO processed_relay_events (event_id, provider, payment_reference, payload)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (event_id) DO NOTHING`,
    [eventId, provider, reference, payload]
  );

  // If already exists, acknowledge duplicate immediately
  if (insertResult.rowCount === 0) {
    console.log(`Duplicate event ${eventId} acknowledged without re-processing.`);
    return res.status(200).json({ status: 'duplicate_acknowledged' });
  }

  // 3. Enqueue Background Task (< 5s response guarantee)
  await paymentQueue.add(
    'process_payment',
    { eventId, provider, reference, payload },
    { jobId: eventId } // BullMQ job deduplication
  );

  // 4. Immediate HTTP 200 OK
  return res.status(200).json({ status: 'accepted' });
});
```
