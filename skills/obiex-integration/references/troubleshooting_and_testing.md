# Obiex Testing & Troubleshooting Guide

This guide covers testing workflows in the Obiex staging environment, error codes, and troubleshooting common integration issues.

---

## 1. Staging Environment & Sandbox Testing

Obiex provides a dedicated staging environment for development and automated testing:

| Environment | Base URL | Purpose |
| :--- | :--- | :--- |
| **Staging** | `https://staging.api.obiex.finance/v1` | Testing deposits, withdrawals, and swaps without real funds. Real email notifications and webhooks fire. |
| **Production** | `https://api.obiex.finance/v1` | Live money, actual blockchain interactions, real bank disbursements. |

### Creating a Staging Account
1. Visit the dedicated staging signup portal: `https://staging.app.obiex.finance/auth/signup`
2. Create an account and navigate to **Settings > Developers > API Keys**.
3. Generate your staging `API Key` and `API Secret`.
4. In your code, set `sandboxMode: true` in the official SDK or point your HTTP client base URL to `https://staging.api.obiex.finance/v1`.

```typescript
import { ObiexClient } from 'obiex-api';

const stagingClient = new ObiexClient({
  apiKey: process.env.OBIEX_STAGING_KEY!,
  apiSecret: process.env.OBIEX_STAGING_SECRET!,
  sandboxMode: true, // Automatically targets https://staging.api.obiex.finance
});
```

---

## 2. Common Errors & Troubleshooting

### 1. `401 Unauthorized` / Invalid Signature
**Symptoms**: API rejects request with 401 status.
**Root Causes & Fixes**:
- **Missing `/v1` in Signature String**: The message to sign MUST include `/v1`.  
  *Wrong*: `GET/addresses/me/broker1761480000000`  
  *Correct*: `GET/v1/addresses/me/broker1761480000000`
- **Timestamp Clock Skew**: If your server clock differs by more than 5 minutes from NTP time, Obiex rejects the request to prevent replay attacks. Run `ntpdate` or sync your server clock.
- **Header Naming**: Ensure headers are exactly `x-api-key`, `x-api-timestamp`, and `x-api-signature`.
- **Secret Key Whitespace**: Verify no trailing spaces or newlines exist in your environment variable.

### 2. `429 Too Many Requests` / Rate Limit Exceeded
**Symptoms**: HTTP 429 received.
**Root Causes & Fixes**:
- **Quote Endpoint Limit**: `POST /trades/quote` is strictly capped at **100 requests per hour**.  
  *Fix*: Cache rates using `GET /trades/fiat-rates` or use `POST /trades/instant-swap` for automated systems.
- **Global API Limit**: Standard endpoints are rate-limited to **200 requests per minute**. Implement request queuing or backoff algorithms.

### 3. `400 Bad Request` / Invalid Currency or Network
**Symptoms**: `{"message": "Invalid currency or network code"}`.
**Root Causes & Fixes**:
- **Using Display Names instead of System Codes**:  
  *Wrong*: `currency: "Tether"`, `network: "Tron (TRC20)"`  
  *Correct*: `currency: "USDT"`, `network: "TRX"`
- **Inactive Network**: Attempting to generate an address on a network where `isReceivable: false`. Query `GET /currencies/networks/active` before calling `POST /addresses/broker`.

### 4. `422 Unprocessable Entity` / Expired Quote or Insufficient Balance
**Symptoms**: Trade or withdrawal cannot be processed.
**Root Causes & Fixes**:
- **Quote Expired**: Quotes returned from `POST /trades/quote` expire in **30 seconds**. If `POST /trades/accept` is called after expiration, Obiex rejects the trade.  
  *Fix*: Regenerate quote immediately before execution.
- **Insufficient Wallet Balance**: Payout amount exceeds available funds. Note that withdrawal fees are deducted; call `GET /wallets/:currencyCode` to verify available funds.

---

## 3. SDK Error Handling

When using `obiex-api`, API errors are thrown as instances of `ServerError`:

```typescript
import { ObiexClient, ServerError } from 'obiex-api';

const client = new ObiexClient({
  apiKey: process.env.OBIEX_API_KEY!,
  apiSecret: process.env.OBIEX_API_SECRET!,
});

try {
  await client.withdrawCrypto('USDT', 500, {
    address: 'TLyqzVGLV1srkB7dToTAvZgqncAbc12345',
    network: 'TRX',
  });
} catch (error) {
  if (error instanceof ServerError) {
    console.error('HTTP Status:', error.status); // e.g. 400, 401, 422
    console.error('API Error Message:', error.message);
  } else {
    console.error('Network or client error:', error);
  }
}
```

---

## 4. Production Readiness Checklist

Before moving live funds onto Obiex:
- [ ] Staging tests passed for deposit address generation, RFQ swaps, and payout flows.
- [ ] Switched `sandboxMode` to `false` and loaded production API keys.
- [ ] Destination address formatting and network compatibility are validated before calling `POST /wallets/ext/debit/crypto`.
- [ ] All fiat off-ramping calls verify the bank account name via `GET /ngn-payments/accounts/resolve` prior to debit.
- [ ] Webhook endpoint acknowledges all payloads with immediate `200 OK` and performs asynchronous transaction verification via `GET /transactions/:id`.
