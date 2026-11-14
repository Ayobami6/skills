# Obiex API v1 Reference Guide

Complete reference for the Obiex REST API (`https://api.obiex.finance/v1/`).

---

## 1. Environments & Base URLs

| Environment | Base URL | Description | Signup Portal |
| :--- | :--- | :--- | :--- |
| **Staging (Sandbox)** | `https://staging.api.obiex.finance/v1` | Testing environment. No real crypto moved; webhooks and emails fire. | `https://staging.app.obiex.finance/auth/signup` |
| **Production** | `https://api.obiex.finance/v1` | Live environment with real blockchain transactions and bank settlements. | `https://app.obiex.finance/auth/signup` |

### Standard Request Headers
Every authenticated request must include:
```http
x-api-key: your_api_key_here
x-api-timestamp: 1761480000000
x-api-signature: computed_hex_hmac_sha256_signature
Content-Type: application/json
Accept: application/json
```

---

## 2. Currencies & Networks

### Get Tradable Currencies
Retrieves all currencies available on the platform for trading and balances.
- **Method**: `GET`
- **Endpoint**: `/currencies/tradable`
- **Full URL**: `https://api.obiex.finance/v1/currencies/tradable`
- **Response**: Array of currency objects with `code`, `name`, `type` (`CRYPTO` or `FIAT`), and decimal precision.

### Get Active Networks
Retrieves active currencies and their supported blockchain networks, including receivable and withdrawable capability flags.
- **Method**: `GET`
- **Endpoint**: `/currencies/networks/active`
- **Full URL**: `https://api.obiex.finance/v1/currencies/networks/active`
- **Response**:
```json
{
  "USDT": [
    {
      "networkCode": "TRX",
      "networkName": "Tron (TRC20)",
      "isReceivable": true,
      "isWithdrawable": true,
      "withdrawalFee": 1.0,
      "minimumDeposit": 1.0,
      "minimumWithdrawal": 5.0
    },
    {
      "networkCode": "BSC",
      "networkName": "BNB Smart Chain (BEP20)",
      "isReceivable": true,
      "isWithdrawable": true,
      "withdrawalFee": 0.5,
      "minimumDeposit": 1.0,
      "minimumWithdrawal": 5.0
    }
  ]
}
```

### Get Withdrawal Currency Networks
Retrieves specific network metadata and withdrawal fees for a given currency ID or code.
- **Method**: `GET`
- **Endpoint**: `/currencies/:id/networks`
- **Full URL**: `https://api.obiex.finance/v1/currencies/:id/networks`

---

## 3. Wallets & Balances

### Get Wallet Balance by Currency
Checks balance and available funds for a single currency.
- **Method**: `GET`
- **Endpoint**: `/wallets/:currencyCode`
- **Full URL**: `https://api.obiex.finance/v1/wallets/USDT`
- **Response**:
```json
{
  "currency": "USDT",
  "available": "5420.50",
  "locked": "0.00",
  "total": "5420.50"
}
```

### Get All Wallets
Returns account balances across all supported assets.
- **Method**: `GET`
- **Endpoint**: `/wallets`
- **Full URL**: `https://api.obiex.finance/v1/wallets`

---

## 4. Collections & Crypto Deposit Addresses

### Create Deposit Address (Broker)
Generates or retrieves a unique crypto deposit address for an end customer.
- **Method**: `POST`
- **Endpoint**: `/addresses/broker`
- **Full URL**: `https://api.obiex.finance/v1/addresses/broker`
- **Request Payload**:
```json
{
  "uniqueUserIdentifier": "customer_user_984712",
  "currency": "USDT",
  "network": "TRX"
}
```
- **Response**:
```json
{
  "address": "TNPwF88VzW5CjXpWw9tP8YmYhYw...",
  "currency": "USDT",
  "network": "TRX",
  "memo": null,
  "uniqueUserIdentifier": "customer_user_984712"
}
```

### Get Broker Deposit Addresses
Lists all deposit addresses created for your organization.
- **Method**: `GET`
- **Endpoint**: `/addresses/me/broker`
- **Full URL**: `https://api.obiex.finance/v1/addresses/me/broker`

---

## 5. Multi-Customer Business Collections (Fiat Virtual Accounts)

### Create Virtual Account Collection
Generates a 30-minute dynamic virtual bank account tied to customer identity (BVN/NIN) for NGN collection.
- **Method**: `POST`
- **Endpoint**: `/collections`
- **Full URL**: `https://api.obiex.finance/v1/collections`
- **Request Payload**:
```json
{
  "amount": 250000,
  "sourceCurrency": "NGNX",
  "targetCurrency": "USDT",
  "customer": {
    "firstName": "Chinedu",
    "lastName": "Okonkwo",
    "email": "chinedu@example.com",
    "phoneNumber": "08012345678",
    "bvn": "22123456789",
    "nin": "12345678901"
  }
}
```
- **Response**:
```json
{
  "collectionId": "col_88192a01-44bb-4e20",
  "accountNumber": "9928172611",
  "accountName": "Obiex / Chinedu Okonkwo",
  "bankName": "Wema Bank",
  "bankCode": "035",
  "amountExpected": 250000,
  "expiresAt": "2026-11-14T11:00:00Z"
}
```

### Query Collections Endpoints
- **List Collected Customers**: `GET /collections/customers/me`
- **Lookup Customer**: `GET /collections/customers/:id`
- **List Collection Destinations**: `GET /collections/destinations/me`
- **List Collection Transactions**: `GET /collections/transactions/me`

---

## 6. Trading & RFQ Swaps

### Get Trading Pairs
Returns all tradable currency pairs.
- **Method**: `GET`
- **Endpoint**: `/trades/pairs`
- **Full URL**: `https://api.obiex.finance/v1/trades/pairs`

### Get Fiat Rates
Retrieves current live exchange rates for fiat currency pairs (e.g., USDT/NGNX, USDT/GHS).
- **Method**: `GET`
- **Endpoint**: `/trades/fiat-rates`
- **Full URL**: `https://api.obiex.finance/v1/trades/fiat-rates`

### Create Quote (RFQ)
Generates a guaranteed rate quote locked for ~30 seconds.
- **Rate Limit**: 100 requests per hour.
- **Method**: `POST`
- **Endpoint**: `/trades/quote`
- **Full URL**: `https://api.obiex.finance/v1/trades/quote`
- **Request Payload**:
```json
{
  "sourceCurrency": "USDT",
  "targetCurrency": "BTC",
  "amount": 500,
  "side": "BUY"
}
```
- **Response**:
```json
{
  "quoteId": "quot_99a81c-4b72-4d51-9f93",
  "sourceCurrency": "USDT",
  "targetCurrency": "BTC",
  "sourceAmount": 500,
  "targetAmount": 0.00526315,
  "rate": 95000.0,
  "expiresIn": 30
}
```

### Accept Quote
Executes the swap before the quote expires.
- **Method**: `POST`
- **Endpoint**: `/trades/accept`
- **Full URL**: `https://api.obiex.finance/v1/trades/accept`
- **Request Payload**:
```json
{
  "quoteId": "quot_99a81c-4b72-4d51-9f93"
}
```

### Instant Swap
Generates quote and executes trade atomically in one single call.
- **Method**: `POST`
- **Endpoint**: `/trades/instant-swap`
- **Full URL**: `https://api.obiex.finance/v1/trades/instant-swap`
- **Request Payload**:
```json
{
  "sourceCurrency": "USDT",
  "targetCurrency": "NGNX",
  "amount": 100,
  "side": "SELL"
}
```

---

## 7. Payouts & Withdrawals

### List Supported Nigerian Banks
Retrieves the list of active banks and bank codes for NGN fiat payouts.
- **Method**: `GET`
- **Endpoint**: `/ngn-payments/banks`
- **Full URL**: `https://api.obiex.finance/v1/ngn-payments/banks`

### Resolve Nigerian Bank Account
Verifies the recipient account name before initiating a fiat payout.
- **Method**: `GET`
- **Endpoint**: `/ngn-payments/accounts/resolve`
- **Full URL**: `https://api.obiex.finance/v1/ngn-payments/accounts/resolve?accountNumber=0123456789&bankCode=058`
- **Response**:
```json
{
  "accountNumber": "0123456789",
  "accountName": "Jane Doe",
  "bankCode": "058"
}
```

### Crypto Withdrawal (Debit)
Transfers cryptocurrency to an external blockchain address.
- **Method**: `POST`
- **Endpoint**: `/wallets/ext/debit/crypto`
- **Full URL**: `https://api.obiex.finance/v1/wallets/ext/debit/crypto`
- **Request Payload**:
```json
{
  "currency": "USDT",
  "network": "TRX",
  "amount": 250,
  "address": "TLyqzVGLV1srkB7dToTAvZgqncAbc12345",
  "memo": null
}
```

### Fiat Withdrawal (Debit)
Converts crypto balance to fiat and dispatches an instant bank transfer.
- **Method**: `POST`
- **Endpoint**: `/wallets/ext/debit/fiat`
- **Full URL**: `https://api.obiex.finance/v1/wallets/ext/debit/fiat`
- **Request Payload**:
```json
{
  "amount": 150000,
  "currency": "NGNX",
  "accountNumber": "0123456789",
  "accountName": "Jane Doe",
  "bankName": "Guaranty Trust Bank",
  "bankCode": "058"
}
```

---

## 8. Transactions & Webhook Management

### Get Transaction by ID
Queries transaction status, hash, and metadata directly against Obiex.
- **Method**: `GET`
- **Endpoint**: `/transactions/:id`
- **Full URL**: `https://api.obiex.finance/v1/transactions/tx_77218a-99cd`

### Resend Single Webhook
Requests Obiex to re-dispatch a webhook event for a given transaction.
- **Method**: `POST`
- **Endpoint**: `/transactions/resendWebhook`
- **Full URL**: `https://api.obiex.finance/v1/transactions/resendWebhook`
- **Request Payload**:
```json
{
  "id": "tx_77218a-99cd"
}
```

### Resend Multiple Webhooks
Batch re-dispatches webhook events for a list of transactions.
- **Method**: `POST`
- **Endpoint**: `/transactions/resendWebhooks`
- **Full URL**: `https://api.obiex.finance/v1/transactions/resendWebhooks`
- **Request Payload**:
```json
{
  "ids": ["tx_77218a-99cd", "tx_88127b-00fe"]
}
```

---

## 9. HTTP Status Codes & Error Handling

| Status Code | Meaning | Common Cause |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Valid authenticated query or execution |
| `201 Created` | Resource created | Address created, quote accepted, withdrawal initiated |
| `400 Bad Request` | Invalid parameters | Unknown currency code, missing required fields |
| `401 Unauthorized` | Signature error | Missing or malformed `x-api-signature`, timestamp skew > 5 min |
| `404 Not Found` | Resource missing | Invalid transaction ID or customer ID |
| `422 Unprocessable` | Domain failure | Insufficient balance, expired quote, network `isWithdrawable: false` |
| `429 Too Many Requests` | Rate limit | Exceeded 200 req/min or 100 quotes/hour |
| `500 Server Error` | Upstream failure | Temporary Obiex system degradation; retry with exponential backoff |
