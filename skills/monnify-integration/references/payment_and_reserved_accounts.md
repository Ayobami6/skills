# Monnify Payment Flows & Reserved Virtual Accounts

This guide provides an end-to-end walkthrough of accepting payments via Monnify: **Reserved Virtual Accounts** (dedicated NUBANs for wallets), **Dynamic Virtual Accounts** (one-time bank transfers), **Standard Checkout Initialization**, and **Payment Verification**.

---

## 1. Important Note on Currency Formats

> [!IMPORTANT]
> **Monnify uses standard currency values**, not subunits!
> Unlike gateways like Paystack that require kobo (amount * 100), Monnify expects amounts formatted in standard currency units (e.g., `1500.00` or `1500` for ₦1,500.00).

---

## 2. Reserved Virtual Accounts (Dedicated Accounts)

Reserved accounts allocate a dedicated virtual bank account (e.g., Wema Bank, Sterling Bank, Fidelity Bank, Moniepoint) to a specific user or wallet. When the user transfers money to this account via any banking app, Monnify receives it and sends a webhook to your server.

### A. Reserving an Account
* **Endpoint**: `POST /api/v2/bank-transfer/reserved-accounts`
* **Authorization**: `Bearer <accessToken>`
* **Payload Parameters**:
  * `accountReference` *(string, required)*: Unique identifier for the customer or internal wallet ID.
  * `accountName` *(string, required)*: Display name on the generated bank account.
  * `customerEmail` *(string, required)*: Customer's email address.
  * `customerName` *(string, required)*: Customer's legal name.
  * `bvn` *(string, optional/recommended)*: Customer Bank Verification Number (required for full KYC and higher limits).
  * `nin` *(string, optional)*: National Identity Number.
  * `getAllAvailableBanks` *(boolean)*: `true` to generate accounts across all partner banks.
  * `preferredBanks` *(array)*: Array of bank codes if specific banks are desired (e.g., `["035", "232"]`).
  * `restrictPaymentSource` *(boolean)*: If `true`, only accepts transfers originating from accounts matching the user's BVN/name.
  * `incomeSplitConfig` *(array, optional)*: Configuration for sub-account split payments.

#### Example Request
```http
POST /api/v2/bank-transfer/reserved-accounts HTTP/1.1
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "accountReference": "user_wallet_98234",
  "accountName": "Ayo Adeleke Wallet",
  "customerEmail": "ayo.adeleke@example.com",
  "customerName": "Ayobami Adeleke",
  "bvn": "22222222222",
  "currencyCode": "NGN",
  "contractCode": "1234567890",
  "getAllAvailableBanks": true
}
```

#### Example Response
```json
{
  "requestSuccessful": true,
  "responseMessage": "success",
  "responseCode": "0",
  "responseBody": {
    "contractCode": "1234567890",
    "accountReference": "user_wallet_98234",
    "accountName": "Ayo Adeleke Wallet",
    "currencyCode": "NGN",
    "customerEmail": "ayo.adeleke@example.com",
    "customerName": "Ayobami Adeleke",
    "accounts": [
      {
        "bankCode": "035",
        "bankName": "Wema Bank",
        "accountNumber": "9912345678"
      },
      {
        "bankCode": "232",
        "bankName": "Sterling Bank",
        "accountNumber": "8812345678"
      }
    ]
  }
}
```

### B. Updating KYC & Account Details
* **Endpoint**: `PUT /api/v1/bank-transfer/reserved-accounts/{accountReference}/kyc-info`
* **Payload**:
  ```json
  {
    "bvn": "22222222222"
  }
  ```

### C. Deallocating a Reserved Account
* **Endpoint**: `DELETE /api/v1/bank-transfer/reserved-accounts/{accountReference}`

---

## 3. Dynamic Virtual Accounts (One-Time Bank Transfer)

If you do not need permanent customer accounts, you can generate a one-off virtual bank account for a single invoice that automatically expires after payment or timeout.

* **Endpoint**: `POST /api/v1/merchant/bank-transfer/init-payment`
* **Payload**:
  ```json
  {
    "transactionReference": "INV_20260906_001",
    "amount": 5000.00,
    "customerName": "Ayobami Adeleke",
    "customerEmail": "ayo@example.com",
    "paymentDescription": "Order #1043 Invoice",
    "expirySeconds": 1800,
    "contractCode": "1234567890"
  }
  ```
* **Response**: Returns `accountNumber`, `bankName`, `accountDurationSeconds`, and expiration timestamp. Once the customer transfers funds, Monnify triggers the transaction webhook.

---

## 4. Standard Checkout Flow (Web & Mobile)

For web or mobile checkouts accepting Cards, Bank Transfers, USSD, and Phone Numbers:

### A. Initializing a Transaction (Backend)
* **Endpoint**: `POST /api/v1/merchant/transactions/init-transaction`
* **Payload**:
  ```json
  {
    "amount": 10500.00,
    "customerName": "Ayobami Adeleke",
    "customerEmail": "ayo@example.com",
    "paymentReference": "ORD_REF_881923",
    "paymentDescription": "Payment for Electronics",
    "currencyCode": "NGN",
    "contractCode": "1234567890",
    "redirectUrl": "https://merchant.com/checkout/callback",
    "paymentMethods": ["CARD", "ACCOUNT_TRANSFER", "USSD", "PHONE_NUMBER"]
  }
  ```
* **Response**:
  ```json
  {
    "requestSuccessful": true,
    "responseMessage": "success",
    "responseCode": "0",
    "responseBody": {
      "transactionReference": "MNFY|15|202609061118|0001",
      "paymentReference": "ORD_REF_881923",
      "merchantName": "Tech Store Ltd",
      "apiKey": "MK_TEST_...",
      "checkoutUrl": "https://sandbox.monnify.com/checkout/MNFY|15|202609061118|0001"
    }
  }
  ```

### B. Integrating Monnify Web SDK (Client-Side)
Include the script in your HTML/React page:
```html
<script type="text/javascript" src="https://sdk.monnify.com/plugin/monnify.js"></script>
```

Trigger the popup modal:
```javascript
function payWithMonnify() {
  MonnifySDK.initialize({
    amount: 10500.00,
    currency: "NGN",
    reference: "ORD_REF_881923",
    customerFullName: "Ayobami Adeleke",
    customerEmail: "ayo@example.com",
    apiKey: "MK_TEST_XXXXXXXXXX",
    contractCode: "1234567890",
    paymentDescription: "Payment for Electronics",
    onComplete: function(response) {
      console.log("Payment complete:", response);
      // Notify backend to verify on server
    },
    onClose: function(data) {
      console.log("Modal closed by user", data);
    }
  });
}
```

---

## 5. Server-Side Transaction Verification

Never grant value based purely on frontend callback parameters. Always verify transaction status on your server using Monnify's transaction query endpoint.

* **Endpoint**: `GET /api/v2/transactions/{transactionReference}`  
  *or* `GET /api/v2/merchant/transactions/query?paymentReference={paymentReference}`
* **Headers**: `Authorization: Bearer <accessToken>`

### Verification Rules:
1. `response.data.requestSuccessful === true`
2. `response.data.responseBody.paymentStatus === "PAID"`
3. `response.data.responseBody.amountPaid >= expectedAmount`
4. Store `transactionReference` to guarantee idempotency and prevent replay attacks.

### TypeScript Backend Implementation
```typescript
import axios from 'axios';
import { MonnifyTokenManager } from './oauth_and_token_caching';

export class MonnifyPaymentService {
  constructor(
    private tokenManager: MonnifyTokenManager,
    private baseUrl: string = 'https://sandbox.monnify.com'
  ) {}

  public async verifyTransaction(paymentReference: string, expectedAmount: number): Promise<boolean> {
    const token = await this.tokenManager.getAccessToken();
    const url = `${this.baseUrl}/api/v2/merchant/transactions/query?paymentReference=${encodeURIComponent(paymentReference)}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = response.data.responseBody;
    if (
      response.data.requestSuccessful &&
      body.paymentStatus === 'PAID' &&
      Number(body.amountPaid) >= expectedAmount
    ) {
      return true;
    }

    return false;
  }
}
```

