# Downstream Signature Verification Guide

This guide covers validating the `X-PSPRelay-Signature` header delivered by **PSP Relay** to downstream microservices.

---

## 1. Cryptographic Algorithm

PSP Relay signs the forwarded raw JSON payload using the HMAC-SHA256 algorithm with your product's configured `signatureKey` (defined under `products.<product>.secrets.signatureKey` in `config.yaml`).

$$\text{ExpectedSignature} = \text{hex}(\text{HMAC-SHA256}(\text{RawRequestBodyBytes}, \text{signatureKey}))$$

### Non-Negotiable Verification Rules
1. **Raw Body Integrity**: You must calculate the HMAC over the **raw byte buffer** as received over the wire. Do **not** parse the JSON and re-serialize it; differences in key ordering, whitespace, or unicode escaping will invalidate the signature.
2. **Constant-Time Comparison**: Always use timing-safe comparison functions (`crypto.timingSafeEqual`, `hmac.compare_digest`, or `hmac.Equal`) to defend against side-channel timing attacks.
3. **Hex Representation**: The signature in `X-PSPRelay-Signature` is formatted as a 64-character lowercase hexadecimal string. Ensure both compared strings are normalized to lowercase.

---

## 2. Multi-Framework Implementations

### Node.js / Express
```typescript
import express, { Request, Response } from 'express';
import crypto from 'node:crypto';

const app = express();
const SIGNATURE_KEY = process.env.PSP_RELAY_SIGNATURE_KEY || 'sec_sig_mn_83901kd8';

// Crucial: capture raw body buffer before JSON parsing
app.post(
  '/v1/webhooks/psp',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const rawBody = req.body as Buffer;
    const headerSig = req.header('X-PSPRelay-Signature');
    const eventId = req.header('X-PSPRelay-Event-ID');
    const provider = req.header('X-PSP-Provider');

    if (!headerSig) {
      return res.status(401).json({ error: 'Missing X-PSPRelay-Signature header' });
    }

    // Compute expected signature
    const expectedSig = crypto
      .createHmac('sha256', SIGNATURE_KEY)
      .update(rawBody)
      .digest('hex');

    // Constant-time comparison
    const sigBuffer = Buffer.from(headerSig.toLowerCase());
    const expectedBuffer = Buffer.from(expectedSig.toLowerCase());

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Parse JSON safely after cryptographic verification
    const payload = JSON.parse(rawBody.toString('utf-8'));

    // Check idempotency & enqueue background processing
    await handleRelayedWebhook({ eventId, provider, payload });

    // Respond 200 OK fast (< 5s)
    return res.status(200).json({ status: 'accepted' });
  }
);
```

### Next.js App Router (Route Handler)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

const SIGNATURE_KEY = process.env.PSP_RELAY_SIGNATURE_KEY || 'sec_sig_mn_83901kd8';

export async function POST(req: NextRequest) {
  // 1. Read raw ArrayBuffer
  const arrayBuffer = await req.arrayBuffer();
  const rawBody = Buffer.from(arrayBuffer);

  const headerSig = req.headers.get('x-psprelay-signature');
  const eventId = req.headers.get('x-psprelay-event-id');
  const provider = req.headers.get('x-psp-provider');

  if (!headerSig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  // 2. Compute HMAC-SHA256
  const expectedSig = crypto
    .createHmac('sha256', SIGNATURE_KEY)
    .update(rawBody)
    .digest('hex');

  const sigBuffer = Buffer.from(headerSig.toLowerCase());
  const expectedBuffer = Buffer.from(expectedSig.toLowerCase());

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Process verified payload
  const payload = JSON.parse(rawBody.toString('utf-8'));
  // Offload to background worker / queue here

  return NextResponse.json({ status: 'accepted' }, { status: 200 });
}
```

### Python (FastAPI)
```python
import hmac
import hashlib
from fastapi import FastAPI, Request, Header, HTTPException, status
from fastapi.responses import JSONResponse

app = FastAPI()
SIGNATURE_KEY = "sec_sig_mn_83901kd8"

def verify_relay_signature(raw_body: bytes, header_sig: str, key: str) -> bool:
    if not header_sig or not key:
        return False
    expected = hmac.new(key.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected.lower(), header_sig.lower())

@app.post("/v1/webhooks/psp")
async def handle_psp_webhook(
    request: Request,
    x_psprelay_signature: str = Header(None),
    x_psprelay_event_id: str = Header(None),
    x_psp_provider: str = Header(None)
):
    # Retrieve raw unparsed bytes
    raw_body = await request.body()

    # 1. Verify constant-time HMAC-SHA256 signature
    if not verify_relay_signature(raw_body, x_psprelay_signature, SIGNATURE_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PSP Relay signature"
        )

    # 2. Parse verified JSON payload
    payload = await request.json()

    # 3. Offload fulfillment to asynchronous worker (Celery / ARQ / Redis)
    # enqueue_fulfillment(x_psprelay_event_id, x_psp_provider, payload)

    # 4. Immediate acknowledgment (< 5s)
    return JSONResponse(status_code=status.HTTP_200_OK, content={"status": "accepted"})
```

### Python (Django)
```python
import hmac
import hashlib
import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

SIGNATURE_KEY = "sec_sig_mn_83901kd8"

@csrf_exempt
def psp_relay_webhook_view(request):
    if request.method != "POST":
        return HttpResponse(status=405)

    header_sig = request.headers.get("X-PSPRelay-Signature")
    event_id = request.headers.get("X-PSPRelay-Event-ID")
    provider = request.headers.get("X-PSP-Provider")

    if not header_sig:
        return JsonResponse({"error": "Missing signature header"}, status=401)

    # Django stores raw request body in request.body
    raw_body = request.body
    expected_sig = hmac.new(
        SIGNATURE_KEY.encode("utf-8"),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_sig.lower(), header_sig.lower()):
        return JsonResponse({"error": "Invalid signature"}, status=401)

    payload = json.loads(raw_body.decode("utf-8"))
    # Enqueue task in Celery / background queue

    return JsonResponse({"status": "accepted"}, status=200)
```

### Go (`net/http`)
```go
package webhook

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

const ProductSignatureKey = "sec_sig_mn_83901kd8"

func VerifyRelaySignature(rawBody []byte, headerSig, secret string) bool {
	if headerSig == "" || secret == "" {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(rawBody)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(strings.ToLower(expected)), []byte(strings.ToLower(headerSig)))
}

func HandlePSPWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "cannot read request body", http.StatusBadRequest)
		return
	}

	sigHeader := r.Header.Get("X-PSPRelay-Signature")
	eventID := r.Header.Get("X-PSPRelay-Event-ID")
	provider := r.Header.Get("X-PSP-Provider")

	if !VerifyRelaySignature(body, sigHeader, ProductSignatureKey) {
		http.Error(w, "invalid relay signature", http.StatusUnauthorized)
		return
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		http.Error(w, "invalid json payload", http.StatusBadRequest)
		return
	}

	// Enqueue async processing with eventID, provider, payload

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"accepted"}`))
}
```

### Rust (`actix-web`)
```rust
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;
const SIGNATURE_KEY: &str = "sec_sig_mn_83901kd8";

pub async fn handle_psp_webhook(
    req: HttpRequest,
    body: web::Bytes,
) -> impl Responder {
    let header_sig = match req.headers().get("X-PSPRelay-Signature") {
        Some(sig) => match sig.to_str() {
            Ok(s) => s.to_lowercase(),
            Err(_) => return HttpResponse::Unauthorized().body("Invalid signature header encoding"),
        },
        None => return HttpResponse::Unauthorized().body("Missing X-PSPRelay-Signature"),
    };

    let mut mac = match HmacSha256::new_from_slice(SIGNATURE_KEY.as_bytes()) {
        Ok(m) => m,
        Err(_) => return HttpResponse::InternalServerError().finish(),
    };

    mac.update(&body);
    let expected = hex::encode(mac.finalize().into_bytes()).to_lowercase();

    // Constant-time check
    if !subtle::ConstantTimeEq::ct_eq(expected.as_bytes(), header_sig.as_bytes()).into() {
        return HttpResponse::Unauthorized().body("Signature verification failed");
    }

    // Process verified event...
    HttpResponse::Ok().json(serde_json::json!({ "status": "accepted" }))
}
```
