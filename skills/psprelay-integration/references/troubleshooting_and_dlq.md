# Troubleshooting & Dead-Letter Queue (DLQ) Guide

This guide details common downstream integration pitfalls, diagnosing delivery failures, and recovering events from **PSP Relay**'s Dead-Letter Queue.

---

## 1. Common Integration Pitfalls

### 1. `401 Unauthorized` / Signature Mismatch
**Symptoms**: PSP Relay logs a delivery failure with HTTP 401 response from your endpoint.
**Root Causes & Solutions**:
- **Re-serialized JSON used for HMAC**: If your framework automatically parses JSON into an object and you call `JSON.stringify(req.body)` to compute the HMAC, differences in whitespace, key ordering, or number serialization will produce a different hash.  
  *Fix*: Capture the unparsed `Buffer` / `bytes` directly from the incoming HTTP stream (e.g. `express.raw({ type: 'application/json' })` or `request.body` in Django/FastAPI).
- **Mismatched `signatureKey`**: Ensure the secret configured in your downstream app matches the `signatureKey` defined under your product in `config.yaml`.
- **Case Sensitivity**: The `X-PSPRelay-Signature` header is lowercase hex. Normalize both expected and received signatures to lowercase before comparison.

### 2. Relay Triggers Retries Despite "Successful" Processing (Timeout > 5s)
**Symptoms**: Downstream logs show the payment was fulfilled, but PSP Relay retries the webhook with `X-PSPRelay-Retry-Attempt: 1`, `2`, `3`.
**Root Cause**:
- PSP Relay enforces a strict **5-second timeout** on outbound HTTP calls. If your database writes, email dispatch, or third-party API calls take $> 5000\text{ms}$, PSP Relay aborts the connection and marks the delivery as failed.
- *Fix*: Immediately return HTTP 200 after writing to `processed_relay_events` and delegate heavy processing to an asynchronous worker queue.

### 3. Events Missing from Downstream (Routing to DLQ)
**Symptoms**: Customer paid successfully on Paystack or Flutterwave, but your downstream endpoint never received a webhook.
**Root Cause**:
- **Unmatched Payment Reference**: The payment reference generated during checkout lacked the product's configured prefix or HMAC token (e.g. `inv_982341` instead of `3f9a1c0be27d_inv_982341` or `MN_inv_982341`).
- In PSP Relay, events with unrecognized references fail closed and are dispatched to the Dead-Letter Queue (`psp.webhooks.dlq`).
- *Fix*: Verify outbound reference tagging using `outbound_reference_tagging.md`.

---

## 2. Inspecting Failures via Management Console (`/admin`)

PSP Relay provides an embedded HTMX Management Console at `http://<relay-host>:8083/admin`:

1. **Events View (`/admin`)**: Filter events by `product`, `provider`, or payment reference query `q`.
2. **Payload Inspector**: Click on any event to view its exact headers and formatted JSON body.
3. **Delivery Failures Table**: View failed delivery attempts, HTTP status codes, latency, and error messages.

---

## 3. Replay & Recovery API Operations

If your downstream service was offline or failed to process events, operators can trigger re-deliveries via the Admin API:

### Synchronous Replay for a Specific Event
Re-dispatches an event directly to its product endpoints:
```bash
curl -X POST http://localhost:8083/v1/admin/events/7a8f9b0c-1234-5678-9abc-def012345678/replay \
  -u "admin:your_password"
```

### Retry a Specific Delivery Failure
Executes an immediate synchronous retry for a recorded failure. If the failure was classified as `unmatched`, this operation re-evaluates `config.yaml` routing rules:
```bash
curl -X POST http://localhost:8083/v1/admin/failures/123/retry \
  -u "admin:your_password"
```

### Bulk Retry Pending Failures
Resets matching `FAILED` or `RETRYING` delivery failures for automatic background retry processing:
```bash
curl -X POST http://localhost:8083/v1/admin/failures/bulk-retry \
  -u "admin:your_password" \
  -H "Content-Type: application/json" \
  -d '{"product": "mailnow", "provider": "paystack"}'
```
