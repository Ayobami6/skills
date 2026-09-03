# Bitnob REST API Reference

Base URL: `https://api.bitnob.co/api/v1`

All requests require Bearer authentication:
```http
Authorization: Bearer <YOUR_BITNOB_API_KEY>
Content-Type: application/json
Accept: application/json
```

---

## 1. Wallets & Lightning Network

### Create Lightning Invoice
Generate a BOLT11 invoice for receiving instant micropayments.

- **Endpoint**: `POST /wallets/ln/createinvoice`
- **Request Body**:
```json
{
  "customerEmail": "user@example.com",
  "satoshis": 10000,
  "description": "Invoice for order #1234",
  "expiresIn": 3600
}
```
- **Response (`200 OK`)**:
```json
{
  "status": true,
  "message": "Lightning invoice created successfully",
  "data": {
    "id": "ln_inv_987654321",
    "payment_request": "lnbc100u1p3...",
    "r_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "expires_at": "2026-09-03T10:15:00.000Z",
    "satoshis": 10000
  }
}
```

### Pay Lightning Invoice
Pay an external BOLT11 invoice instantly from your Bitnob wallet balance.

- **Endpoint**: `POST /wallets/ln/pay`
- **Request Body**:
```json
{
  "request": "lnbc100u1p3...",
  "reference": "ref_tx_9981245",
  "customerEmail": "user@example.com"
}
```
- **Response (`200 OK`)**:
```json
{
  "status": true,
  "message": "Lightning payment successful",
  "data": {
    "id": "ln_pay_123456",
    "reference": "ref_tx_9981245",
    "status": "success",
    "satoshis": 10000,
    "fee": 1
  }
}
```

### Decode Lightning Payment Request
Inspect details and validation of a BOLT11 invoice before paying.

- **Endpoint**: `POST /wallets/ln/decodepayreq`
- **Request Body**:
```json
{
  "request": "lnbc100u1p3..."
}
```

---

## 2. On-Chain Bitcoin

### Generate BTC Address
Generate a dedicated on-chain Bitcoin receiving address.

- **Endpoint**: `POST /addresses/generate`
- **Request Body**:
```json
{
  "customerEmail": "user@example.com",
  "label": "Deposit Address"
}
```
- **Response (`200 OK`)**:
```json
{
  "status": true,
  "message": "Address generated successfully",
  "data": {
    "address": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    "customerEmail": "user@example.com"
  }
}
```

### Send On-Chain Bitcoin
Send Bitcoin to an external on-chain Bitcoin address.

- **Endpoint**: `POST /wallets/btc/send`
- **Request Body**:
```json
{
  "satoshis": 50000,
  "address": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
  "customerEmail": "user@example.com",
  "priority": "medium",
  "description": "Withdrawal to personal cold storage"
}
```
*Note: `priority` can be `"slow"`, `"medium"`, or `"fast"`.*

---

## 3. Customers & KYC

### Create Customer
Register a customer profile for KYC compliance before creating virtual cards.

- **Endpoint**: `POST /customers`
- **Request Body**:
```json
{
  "email": "janedoe@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+2348012345678",
  "countryCode": "NG",
  "idType": "BVN",
  "idNumber": "22222222222",
  "dateOfBirth": "1995-04-12",
  "line1": "15 Marina Road",
  "city": "Lagos",
  "state": "Lagos",
  "zipCode": "100001"
}
```

### Get Customer Profile
- **Endpoint**: `GET /customers/{customerId}` or `GET /customers?email=janedoe@example.com`

---

## 4. Virtual USD Debit Cards

### Create / Issue Virtual Card
- **Endpoint**: `POST /cards/virtual`
- **Request Body**:
```json
{
  "customerId": "cust_821389218",
  "currency": "USD",
  "amount": 5000,
  "brand": "visa"
}
```

### Get Virtual Card Details
- **Endpoint**: `GET /cards/virtual/{cardId}`

### Fund Virtual Card
- **Endpoint**: `POST /cards/virtual/{cardId}/fund`
- **Request Body**:
```json
{
  "amount": 2500
}
```

### Withdraw from Virtual Card
- **Endpoint**: `POST /cards/virtual/{cardId}/withdraw`
- **Request Body**:
```json
{
  "amount": 1000
}
```

### Freeze / Unfreeze Card
- **Endpoints**:
  - `POST /cards/virtual/{cardId}/freeze`
  - `POST /cards/virtual/{cardId}/unfreeze`

### Get Card Transactions
- **Endpoint**: `GET /cards/virtual/{cardId}/transactions`

---

## 5. Payouts, Banks & Swaps

### Get Supported Banks / Institutions
- **Endpoint**: `GET /payouts/banks?country=NG`

### Initiate Bank Payout
- **Endpoint**: `POST /payouts`
- **Request Body**:
```json
{
  "customerEmail": "user@example.com",
  "accountNumber": "0123456789",
  "bankCode": "058",
  "amount": 250000,
  "currency": "NGN",
  "reference": "payout_ref_1002"
}
```

### Currency Swap
Exchange between crypto and fiat balances.

- **Endpoint**: `POST /swap`
- **Request Body**:
```json
{
  "fromCurrency": "BTC",
  "toCurrency": "USD",
  "amount": 0.005
}
```

---

## 6. Hosted Checkout & Invoicing

### Create Checkout Session
- **Endpoint**: `POST /checkout`
- **Request Body**:
```json
{
  "amount": 1500,
  "currency": "USD",
  "customerEmail": "customer@example.com",
  "customerName": "Alice Johnson",
  "callbackUrl": "https://myapp.com/checkout/callback",
  "description": "Order #4892"
}
```
- **Response (`200 OK`)**:
```json
{
  "status": true,
  "message": "Checkout created successfully",
  "data": {
    "id": "chk_819238912",
    "checkoutUrl": "https://checkout.bitnob.co/pay/chk_819238912"
  }
}
```

### Verify Checkout Session
- **Endpoint**: `GET /checkout/{checkoutId}`

