# Bitnob Webhook Handling & HMAC-SHA512 Verification

Bitnob dispatches asynchronous webhooks for all transaction state changes. To ensure that incoming webhooks are authentic and haven't been tampered with, Bitnob computes an HMAC-SHA512 signature using your Webhook Secret and includes it in the `x-bitnob-signature` HTTP header.

---

## 1. Webhook Signature Verification Rules

1. **Use Raw Request Body**: You must compute the HMAC hash using the exact, unparsed raw body string/buffer before JSON parsing.
2. **Timing-Safe Comparison**: Always use constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing attacks.
3. **Immediate HTTP 200 OK**: Return a `200 OK` status immediately before running long asynchronous jobs or external DB transactions.
4. **Idempotency**: Webhook deliveries can be retried if timeouts occur. Maintain an event log table to discard duplicate event IDs or references.

---

## 2. Common Event Types

| Event Name | Description | Action Required |
| :--- | :--- | :--- |
| `lightning.success` | A Lightning invoice was paid | Credit customer account / mark order as paid |
| `btc.received` | On-chain BTC detected/confirmed | Check confirmation count; credit customer |
| `virtualcard.transaction` | Virtual card debit, refund, or authorization | Update customer card statement |
| `payout.successful` | Outbound bank or mobile money payout settled | Update payout ledger status to `successful` |
| `payout.failed` | Outbound payout failed or reversed | Mark failed, refund internal balance |
| `checkout.completed` | Hosted checkout completed | Fulfill e-commerce order |

---

## 3. Implementation Examples

### Node.js (Express)
```typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();
const BITNOB_WEBHOOK_SECRET = process.env.BITNOB_WEBHOOK_SECRET || '';

// CRITICAL: Preserve raw body for signature verification
app.post(
  '/webhooks/bitnob',
  express.raw({ type: 'application/json' }),
  (req: Request, res: Response) => {
    const signature = req.headers['x-bitnob-signature'] as string;
    const rawBody = req.body.toString('utf8');

    if (!signature) {
      return res.status(400).send('Missing signature header');
    }

    // Compute expected hash
    const expectedHash = crypto
      .createHmac('sha512', BITNOB_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    // Timing-safe verification
    const sigBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedHash, 'utf8');

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return res.status(401).send('Invalid webhook signature');
    }

    // Acknowledge immediately
    res.status(200).json({ received: true });

    // Parse and handle event
    const event = JSON.parse(rawBody);
    handleBitnobEvent(event).catch(console.error);
  }
);

async function handleBitnobEvent(event: any) {
  switch (event.event) {
    case 'lightning.success':
      console.log('Lightning invoice paid:', event.data);
      break;
    case 'btc.received':
      console.log('On-chain BTC received:', event.data);
      break;
    case 'virtualcard.transaction':
      console.log('Card transaction:', event.data);
      break;
    case 'payout.successful':
      console.log('Payout settled:', event.data);
      break;
    default:
      console.log('Unhandled event:', event.event);
  }
}
```

### Next.js (App Router `app/api/webhooks/bitnob/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const secret = process.env.BITNOB_WEBHOOK_SECRET || '';
  const signature = req.headers.get('x-bitnob-signature');
  const rawBody = await req.text();

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const expectedHash = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedHash, 'utf8');

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  // Process event asynchronously or queue
  return NextResponse.json({ received: true });
}
```

### Python (FastAPI)
```python
import hmac
import hashlib
from fastapi import FastAPI, Request, HTTPException, Header

app = FastAPI()
WEBHOOK_SECRET = "your_webhook_secret"

@app.post("/webhooks/bitnob")
async def bitnob_webhook(request: Request, x_bitnob_signature: str = Header(None)):
    if not x_bitnob_signature:
        raise HTTPException(status_code=400, detail="Missing signature header")

    body_bytes = await request.body()
    computed_signature = hmac.new(
        WEBHOOK_SECRET.encode("utf-8"),
        body_bytes,
        hashlib.sha512
    ).hexdigest()

    if not hmac.compare_digest(computed_signature, x_bitnob_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    event = await request.json()
    # Process event asynchronously
    return {"status": "success"}
```

### Go
```go
package main

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"io"
	"net/http"
	"os"
)

func bitnobWebhookHandler(w http.ResponseWriter, r *http.Request) {
	signature := r.Header.Get("x-bitnob-signature")
	if signature == "" {
		http.Error(w, "Missing signature header", http.StatusBadRequest)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Cannot read body", http.StatusBadRequest)
		return
	}

	secret := os.Getenv("BITNOB_WEBHOOK_SECRET")
	mac := hmac.New(sha512.New, []byte(secret))
	mac.Write(body)
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(signature), []byte(expectedSig)) {
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}
```

