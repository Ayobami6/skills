# PSP Relay API & Payload Reference Guide

This reference provides a detailed breakdown of the HTTP requests, headers, and payloads delivered by **PSP Relay** to downstream product endpoints, as well as the administrative replay APIs.

---

## 1. Downstream Request Anatomy

When PSP Relay forwards a verified webhook to a downstream product endpoint, it delivers an HTTP `POST` request containing:
- **Dedicated Relay Headers**: Identifying the source provider, durable event ID, routing mode, and HMAC signature.
- **Original PSP Headers**: Preserved verbatim from the incoming provider request.
- **Raw JSON Body**: The authentic, unaltered byte-for-byte payload emitted by the PSP.

### Example Request Structure
```http
POST /v1/webhooks/psp HTTP/1.1
Host: api.yourproduct.com
Content-Type: application/json
X-PSP-Provider: paystack
X-PSPRelay-Event-ID: 7a8f9b0c-1234-5678-9abc-def012345678
X-PSPRelay-Routing-Mode: direct
X-PSPRelay-Signature: 8f3c7e92b5a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef
X-PSPRelay-Retry-Attempt: 1
X-Paystack-Signature: 68673752e2e92c...

{
  "event": "charge.success",
  "data": { ... }
}
```

---

## 2. Downstream Headers Reference

| Header | Present | Type | Description |
| :--- | :--- | :--- | :--- |
| **`Content-Type`** | Always | String | Always set to `application/json` |
| **`X-PSP-Provider`** | Always | String | Source provider name: `paystack`, `flutterwave`, or `monnify` |
| **`X-PSPRelay-Event-ID`** | Always | UUID | Durable, globally unique Relay event identifier. **Use this as your primary deduplication key.** |
| **`X-PSPRelay-Routing-Mode`** | Always | String | Classification: `direct` (routed via payment reference token) or `broadcast` |
| **`X-PSPRelay-Signature`** | When configured | Hex (64 chars) | HMAC-SHA256 signature of the raw body generated with your product's `signatureKey` |
| **`X-PSPRelay-Retry-Attempt`** | On retries only | Integer | Counter indicating retry attempt number (`1`, `2`, `3`) |
| **Original PSP Headers** | Always | String | Preserved from incoming PSP request (e.g. `X-Paystack-Signature`, `verif-hash`, `monnify-signature`) |

---

## 3. Concrete Relayed Provider Payloads

### Paystack Relayed Payload (`charge.success`)
```http
POST /v1/webhooks/psp HTTP/1.1
Content-Type: application/json
X-PSP-Provider: paystack
X-PSPRelay-Event-ID: 104a2311-5160-42ad-b62c-98f304c78d0a
X-PSPRelay-Routing-Mode: direct
X-PSPRelay-Signature: a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0
X-Paystack-Signature: 9c8b7a6e5d4c3b2a10987654321fedcba0987654321fedcba0987654321fedcb

{
  "event": "charge.success",
  "data": {
    "id": 3029482910,
    "domain": "live",
    "status": "success",
    "reference": "3f9a1c0be27d_inv_982341",
    "amount": 2500000,
    "message": null,
    "gateway_response": "Successful",
    "paid_at": "2026-11-14T11:00:22.000Z",
    "created_at": "2026-11-14T10:59:45.000Z",
    "channel": "card",
    "currency": "NGN",
    "ip_address": "102.89.34.12",
    "metadata": {
      "customer_id": "usr_94812",
      "plan": "enterprise"
    },
    "customer": {
      "id": 849201,
      "email": "billing@example.com",
      "customer_code": "CUS_xxxxxxxxxx"
    }
  }
}
```

### Flutterwave Relayed Payload (`charge.completed`)
```http
POST /v1/webhooks/psp HTTP/1.1
Content-Type: application/json
X-PSP-Provider: flutterwave
X-PSPRelay-Event-ID: 29bc4891-9102-4bc1-aa01-491203498a12
X-PSPRelay-Routing-Mode: direct
X-PSPRelay-Signature: f9e8d7c6b5a43210fedcba9876543210fedcba9876543210fedcba9876543210
verif-hash: flw_sec_hash_xxxxxxxxxxxxx

{
  "event": "charge.completed",
  "data": {
    "id": 8941235,
    "tx_ref": "MN_sub_order_48210",
    "flw_ref": "FLW-MOCK-8941235",
    "amount": 50000,
    "currency": "NGN",
    "charged_amount": 50000,
    "status": "successful",
    "payment_type": "bank_transfer",
    "created_at": "2026-11-14T11:15:00.000Z",
    "customer": {
      "id": 91823,
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
}
```

### Monnify Relayed Payload (`SUCCESSFUL_TRANSACTION`)
```http
POST /v1/webhooks/psp HTTP/1.1
Content-Type: application/json
X-PSP-Provider: monnify
X-PSPRelay-Event-ID: c56a7d8e-9012-43fa-876b-123456789abc
X-PSPRelay-Routing-Mode: direct
X-PSPRelay-Signature: b4c3d2e1f0a987654321fedcba0987654321fedcba0987654321fedcba098765
monnify-signature: 4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123

{
  "eventType": "SUCCESSFUL_TRANSACTION",
  "eventData": {
    "product": {
      "reference": "MN_res_acc_39201",
      "type": "RESERVED_ACCOUNT"
    },
    "transactionReference": "MNFY|20261114|9840213",
    "paymentReference": "MN_res_acc_39201",
    "amountPaid": "10000.00",
    "totalPayable": "10000.00",
    "settlementAmount": "9850.00",
    "paidOn": "14/11/2026 11:20:15 AM",
    "paymentStatus": "PAID",
    "paymentMethod": "ACCOUNT_TRANSFER",
    "currency": "NGN",
    "customer": {
      "name": "Acme Corp",
      "email": "finance@acme.com"
    }
  }
}
```

---

## 4. Admin & Manual Replay Endpoints

PSP Relay exposes an Admin API protected by HTTP Basic Auth (`ADMIN_USERNAME` / `ADMIN_PASSWORD`) allowing operators to inspect and replay webhooks:

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/v1/admin/events` | `GET` | List paginated events filtered by `product`, `provider`, `status`, or search query `q` |
| `/v1/admin/events/:id` | `GET` | Retrieve full event payload, headers, and historical delivery attempts |
| `/v1/admin/events/:id/replay` | `POST` | Replays an event synchronously to all configured target product endpoints |
| `/v1/admin/failures` | `GET` | List delivery failure records filtered by `status`, `product`, or `event_id` |
| `/v1/admin/failures/:id/retry` | `POST` | Executes an immediate synchronous retry for a single delivery failure |
| `/v1/admin/failures/bulk-retry` | `POST` | Resets matching failed deliveries for background retry processing |
