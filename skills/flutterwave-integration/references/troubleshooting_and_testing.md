# Flutterwave Testing, Sandbox & Troubleshooting Guide

This guide provides test credentials, error simulation methods, and solutions to common pitfalls when integrating Flutterwave API v3.

---

## 1. Sandbox Environment Setup

Flutterwave utilizes a unified API domain (`https://api.flutterwave.com/v3`). The environment is controlled entirely by the keys you provide in the request headers:

| Mode | Secret Key Prefix | Public Key Prefix | Behavior |
| :--- | :--- | :--- | :--- |
| **Test / Sandbox** | `FLWSECK_TEST-...` | `FLWPUBK_TEST-...` | Simulated transactions; no real money moves. |
| **Production / Live** | `FLWSECK-...` | `FLWPUBK-...` | Real financial transactions and bank settlements. |

---

## 2. Standard Test Cards

When testing card payments with your test API keys, use these card numbers:

| Card Brand | Card Number | Expiry | CVV | PIN | Test OTP | Auth Flow |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MasterCard** | `5531886652142950` | `09/32` | `564` | `3310` | `12345` | PIN + OTP |
| **MasterCard** | `5438898014560229` | `10/31` | `564` | `3310` | `12345` | 3D-Secure (3DS) |
| **Visa** | `4187427415564246` | `09/32` | `828` | `3310` | `12345` | 3D-Secure (3DS) |
| **Verve** | `5061460410120223210`| `10/31` | `780` | `3310` | `12345` | PIN + OTP |

> **Crucial Difference**: Flutterwave's default test OTP is **`12345`** (5 digits), unlike Paystack's `123456`.

---

## 3. Error Simulation Codes (Test Mode)

You can simulate specific payment failure flows using custom OTPs in test mode:

| Desired Simulation | Action / OTP to Enter | Resulting Processor Response |
| :--- | :--- | :--- |
| **Successful Payment** | Enter OTP `12345` | `"Approved. Successful"` |
| **Invalid / Wrong OTP** | Enter OTP `5548` | `"Invalid OTP entered"` |
| **Insufficient Funds** | Enter OTP `6648` | `"Insufficient Funds"` |
| **Expired Card** | Use past expiry (e.g. `01/20`) | `"Card expired"` |

---

## 4. Test Bank Accounts for Transfers & Resolution

For testing `POST /v3/accounts/resolve` and `POST /v3/transfers` in test mode:

- **Bank Code**: `044` (Access Bank)
- **Account Number**: `0690000032`
- **Expected Account Name**: `JOHN DOE` or `Pastor Bright`

---

## 5. Top 6 Integration Pitfalls & How to Avoid Them

### Pitfall 1: Multiplying Amount by 100 (Major vs Minor Currency Units)
- **The Bug**: Sending `amount: 500000` assuming the API expects kobo/cents.
- **The Impact**: The customer is charged ₦500,000 instead of ₦5,000!
- **The Fix**: Flutterwave expects standard major decimal units (`amount: 5000` or `amount: 5000.00`). **Never multiply by 100**.

### Pitfall 2: Checking `data.status === "success"`
- **The Bug**:
  ```typescript
  if (data.status === 'success') { fulfillOrder(); } // BUG!
  ```
- **The Impact**: In transaction verification responses, the outer envelope has `status: "success"`, but the transaction entity inside has `data.status === "successful"` (with `-ful`). If you check `data.status === "success"`, the condition will evaluate to false and orders will fail to fulfill.
- **The Fix**:
  ```typescript
  if (response.data.status === 'success' && response.data.data.status === 'successful') {
    fulfillOrder();
  }
  ```

### Pitfall 3: Relying on Frontend Callback Without Server Verification
- **The Bug**: Trusting the `redirect_url` query parameters (`?status=successful`) to mark an order as paid.
- **The Impact**: Anyone can fabricate query parameters and trick your store into marking unpaid orders as paid.
- **The Fix**: Treat frontend redirects as navigational only. Always perform a server-to-server call to `GET /v3/transactions/{id}/verify` or rely on authentic webhooks.

### Pitfall 4: Webhook Signature Mismatch Due to JSON Parsing
- **The Bug**: Computing HMAC-SHA256 after `bodyParser.json()` has parsed and mutated whitespace in the request body.
- **The Impact**: Signature verification consistently fails, resulting in HTTP 401.
- **The Fix**: Always compute signatures using the **unparsed raw body Buffer or string** (`req.rawBody`).

### Pitfall 5: "Transfer not allowed" or Outbound Payout Blocks
- **The Bug**: Transfer requests fail with `400 Bad Request` or `"Transfers are disabled on this account"`.
- **The Impact**: Payouts cannot be dispatched.
- **The Fix**:
  1. Ensure API Transfers are enabled in your Flutterwave dashboard (**Settings > Transfers**).
  2. If IP whitelisting is enabled, add your production server outbound IP under **Settings > Security**.
  3. Ensure your Flutterwave balance has enough funds to cover the transfer amount plus the transaction fee.

### Pitfall 6: Missing BVN on Permanent Virtual Accounts
- **The Bug**: Creating permanent virtual accounts (`is_permanent: true`) in Nigeria without the customer's BVN.
- **The Impact**: API returns validation errors regarding regulatory compliance.
- **The Fix**: Collect and pass an 11-digit BVN (`"bvn": "12345678901"`) when creating static virtual accounts in live mode.

---

## 6. Pre-Flight Production Go-Live Checklist

- [ ] Replaced all `FLWSECK_TEST-...` and `FLWPUBK_TEST-...` keys with live credentials (`FLWSECK_...` and `FLWPUBK_...`).
- [ ] Confirmed amounts are sent in major decimal units (e.g. `5000` for ₦5,000).
- [ ] Configured the Webhook Secret Hash on your Dashboard and set `FLUTTERWAVE_SECRET_HASH` in production environment variables.
- [ ] Webhook handler responds with HTTP 200 immediately before running background tasks.
- [ ] Webhook handler triggers a secondary `GET /v3/transactions/:id/verify` call to guarantee anti-tampering ledger integrity.
- [ ] Row-level locking (`SELECT ... FOR UPDATE`) is in place for wallet balances and financial ledgers.
