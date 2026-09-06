# Monnify Webhook Handling & Cryptographic Security Guide

Webhooks deliver real-time notifications to your server when transactions are paid, reserved accounts are credited, or disbursements complete.

---

## 1. Cryptographic Security & Signature Verification

Monnify signs every webhook request using a **SHA-512 hash** of a concatenation of your `clientSecret` and transaction details.

### The Signature Formula
The hash is computed over five pipe-separated values:

$$\text{SHA512}(\text{clientSecret} + \text{"|"} + \text{paymentReference} + \text{"|"} + \text{amountPaid} + \text{"|"} + \text{paidOn} + \text{"|"} + \text{transactionReference})$$

* `clientSecret`: Your merchant client secret from the Monnify developer dashboard.
* `paymentReference`: The unique reference for the transaction or reserved account payment.
* `amountPaid`: The string/numeric amount credited.
* `paidOn`: The payment timestamp string (e.g. `"06/09/2026 11:20:00 AM"` or ISO string as received).
* `transactionReference`: Monnify's transaction reference.

> [!IMPORTANT]
> The computed hash is matched against the `monnify-signature` HTTP header (or the `transactionHash` property present in the webhook payload).
> Always use a **constant-time equality check** (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.

---

## 2. Framework Implementations

### Node.js / Express
```typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY!;

interface MonnifyWebhookBody {
  eventData: {
    product: {
      type: string;
      reference: string;
    };
    transactionReference: string;
    paymentReference: string;
    paidOn: string;
    amountPaid: number | string;
    paymentStatus: string;
    customer: {
      email: string;
      name: string;
    };
  };
  eventType: string;
  transactionHash?: string;
}

app.post('/api/monnify/webhook', async (req: Request, res: Response) => {
  const signatureHeader = req.headers['monnify-signature'] as string;
  const payload: MonnifyWebhookBody = req.body;
  const event = payload.eventData;

  if (!event) {
    return res.status(400).send('Invalid webhook structure');
  }

  // 1. Recompute the SHA-512 hash
  const sourceString = `${MONNIFY_SECRET_KEY}|${event.paymentReference}|${event.amountPaid}|${event.paidOn}|${event.transactionReference}`;
  const calculatedHash = crypto.createHash('sha512').update(sourceString).digest('hex');

  // 2. Validate against header or transactionHash
  const incomingHash = signatureHeader || payload.transactionHash;
  if (!incomingHash) {
    return res.status(401).send('Missing signature');
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(calculatedHash, 'hex'),
    Buffer.from(incomingHash, 'hex')
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // 3. Immediately acknowledge receipt to Monnify
  res.status(200).json({ status: 'ok' });

  // 4. Asynchronously handle business logic
  try {
    await processWebhookEvent(payload);
  } catch (error) {
    console.error('Webhook processing failed:', error);
  }
});

async function processWebhookEvent(payload: MonnifyWebhookBody) {
  const { eventType, eventData } = payload;

  if (eventType === 'SUCCESSFUL_TRANSACTION' && eventData.paymentStatus === 'PAID') {
    console.log(`Payment confirmed for reference: ${eventData.paymentReference}`);
    // 1. Perform idempotency check (verify reference has not been processed)
    // 2. Credit user wallet or fulfill order
  }
}
```

---

### Next.js (App Router: `app/api/monnify/webhook/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const secretKey = process.env.MONNIFY_SECRET_KEY!;
  const signatureHeader = req.headers.get('monnify-signature');
  const payload = await req.json();
  const event = payload.eventData;

  if (!event) {
    return NextResponse.json({ error: 'Missing eventData' }, { status: 400 });
  }

  const sourceString = `${secretKey}|${event.paymentReference}|${event.amountPaid}|${event.paidOn}|${event.transactionReference}`;
  const calculatedHash = crypto.createHash('sha512').update(sourceString).digest('hex');

  const incomingHash = signatureHeader || payload.transactionHash;
  if (!incomingHash) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'hex'),
      Buffer.from(incomingHash, 'hex')
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Signature comparison error' }, { status: 401 });
  }

  // Business logic here (ensure idempotency)
  if (payload.eventType === 'SUCCESSFUL_TRANSACTION') {
    // Process payment
  }

  return NextResponse.json({ status: 'success' }, { status: 200 });
}
```

---

### Python / FastAPI
```python
import hashlib
import hmac
import os
from fastapi import FastAPI, Header, HTTPException, Request, Response, status

app = FastAPI()
MONNIFY_SECRET_KEY = os.getenv("MONNIFY_SECRET_KEY", "")

@app.post("/api/monnify/webhook")
async def handle_monnify_webhook(
    request: Request,
    monnify_signature: str = Header(None)
):
    payload = await request.json()
    event = payload.get("eventData", {})
    if not event:
        raise HTTPException(status_code=400, detail="Invalid payload")

    source_string = f"{MONNIFY_SECRET_KEY}|{event.get('paymentReference')}|{event.get('amountPaid')}|{event.get('paidOn')}|{event.get('transactionReference')}"
    calculated_hash = hashlib.sha512(source_string.encode("utf-8")).hexdigest()

    incoming_hash = monnify_signature or payload.get("transactionHash", "")
    if not incoming_hash or not hmac.compare_digest(calculated_hash.lower(), incoming_hash.lower()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    # Idempotency and fulfillment
    event_type = payload.get("eventType")
    if event_type == "SUCCESSFUL_TRANSACTION" and event.get("paymentStatus") == "PAID":
        # Record transaction and credit account
        pass

    return Response(status_code=status.HTTP_200_OK)
```

---

## 3. Idempotency & Delivery Rules

1. **Respond in < 5 seconds**: Monnify retries webhook notifications if it does not receive an HTTP `200 OK` within its timeout window.
2. **Handle Duplicate Deliveries**: Store `transactionReference` in a database table with a unique constraint or an atomic status flag (`processed: boolean`). If a duplicate arrives, acknowledge with HTTP `200` immediately without crediting twice.
3. **Always Double-Check Status**: Never assume a webhook event implies payment success unless `paymentStatus === "PAID"`.

