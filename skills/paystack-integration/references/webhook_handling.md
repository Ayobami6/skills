# Paystack Webhook Handling & Security Guide

Webhooks deliver asynchronous notifications when events occur on your Paystack account (payments succeeded, transfers completed, subscriptions renewed).

---

## 1. Webhook Security: HMAC-SHA512 Verification

Every webhook request sent by Paystack contains a cryptographic signature in the `x-paystack-signature` header.

### Critical Rule: Verify Using Raw Request Body
You **must** calculate the hash using the unparsed, raw UTF-8 request body string. Standard JSON body parsers alter whitespace, newlines, and key orders, which invalidates the HMAC hash comparison.

---

## 2. Framework Implementations

### Node.js / Express
```typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

// Capture raw body for webhook endpoint
app.post(
  '/api/paystack/webhook',
  express.raw({ type: 'application/json' }),
  (req: Request, res: Response) => {
    const signature = req.headers['x-paystack-signature'] as string;
    const rawBody = req.body.toString('utf8');

    // Compute expected hash
    const expectedHash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const isValid =
      signature &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHash));

    if (!isValid) {
      return res.status(401).send('Invalid signature');
    }

    // Acknowledge receipt immediately
    res.sendStatus(200);

    // Parse and handle event payload asynchronously
    const event = JSON.parse(rawBody);
    handlePaystackEvent(event).catch(console.error);
  }
);

async function handlePaystackEvent(event: any) {
  switch (event.event) {
    case 'charge.success':
      const { reference, amount, customer } = event.data;
      console.log(`Payment successful for ref ${reference}, amount ${amount}`);
      break;
    case 'transfer.success':
      console.log(`Transfer ${event.data.reference} completed`);
      break;
    case 'transfer.failed':
    case 'transfer.reversed':
      console.log(`Transfer ${event.data.reference} failed/reversed: ${event.data.reason}`);
      break;
  }
}
```

---

### Next.js (App Router: `app/api/paystack/webhook/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY!;
  const signature = req.headers.get('x-paystack-signature');

  // Read raw body as string
  const rawBody = await req.text();

  const expectedHash = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  const isValid =
    signature &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHash));

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // Process payload
  if (payload.event === 'charge.success') {
    const { reference, amount } = payload.data;
    // Update order status in database
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
```

---

### Python (FastAPI)
```python
from fastapi import FastAPI, Request, HTTPException, status
import hmac
import hashlib
import json
import os

app = FastAPI()
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "").encode("utf-8")

@app.post("/api/paystack/webhook")
async def paystack_webhook(request: Request):
    signature = request.headers.get("x-paystack-signature")
    if not signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing signature")

    raw_body = await request.body()

    expected_signature = hmac.new(
        PAYSTACK_SECRET_KEY,
        raw_body,
        hashlib.sha512
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    event = json.loads(raw_body)
    event_type = event.get("event")

    if event_type == "charge.success":
        data = event["data"]
        reference = data["reference"]
        amount = data["amount"]
        # Process order fulfillment

    return {"status": "success"}
```

---

## 3. Essential Event Types

| Event Name | Trigger Condition | Recommended Action |
| :--- | :--- | :--- |
| `charge.success` | A customer payment succeeded. | Verify amount, fulfill order, mark invoice paid. |
| `transfer.success` | A bank transfer/payout was successful. | Update withdrawal status to completed. |
| `transfer.failed` | A bank transfer failed at the interbank switch. | Refund customer internal wallet, notify user. |
| `transfer.reversed` | A transfer was initially successful but reversed by recipient bank. | Revert balance credit, flag for review. |
| `subscription.create` | A recurring subscription was created. | Provision subscription features. |
| `subscription.disable` | A subscription was cancelled or card failed. | Revoke subscription access. |
| `dedicated_account.assign.success` | Virtual account assigned to customer. | Display virtual account details to user. |

---

## 4. Idempotency & Replay Protection

1. Paystack may re-send webhook notifications if your server does not respond with HTTP `200 OK` within 5 seconds.
2. Maintain an `idempotency_keys` or `processed_events` table in your database with unique constraint on `event.data.reference` or `event.data.id`.
3. Check if the event was already processed before applying wallet balances or executing fulfillment.

