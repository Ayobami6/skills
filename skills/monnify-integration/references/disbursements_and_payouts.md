# Monnify Disbursements & Payouts Guide

Monnify's disbursement APIs allow merchants to send funds directly from their Monnify wallet to any commercial bank account or mobile money operator in Nigeria.

---

## 1. Prerequisites

1. **Active Wallet**: An active disbursement wallet with sufficient settlement funds.
2. **2FA / Approval Setting**: In your Monnify Merchant Dashboard, verify whether 2FA (OTP or PIN) is required for API disbursements. If 2FA is enabled, `twoFactorAuthCode` must be supplied with single transfer requests.
3. **Valid CBN Bank Codes**: Monnify uses standard 3-digit Central Bank of Nigeria (CBN) bank codes.

---

## 2. Bank & Account Resolution

Before initiating a transfer, validate the account number and bank code to ensure recipient name accuracy and avoid failed payouts.

### A. List Supported Banks
* **Endpoint**: `GET /api/v1/banks`
* **Authorization**: `Bearer <accessToken>`
* **Response**:
  ```json
  {
    "requestSuccessful": true,
    "responseMessage": "success",
    "responseCode": "0",
    "responseBody": [
      {
        "name": "Access Bank",
        "code": "044",
        "ussdTemplate": "*901#"
      },
      {
        "name": "Guaranty Trust Bank",
        "code": "058",
        "ussdTemplate": "*737#"
      },
      {
        "name": "Zenith Bank",
        "code": "057",
        "ussdTemplate": "*966#"
      }
    ]
  }
  ```

### B. Account Validation (Name Enquiry)
* **Endpoint**: `GET /api/v1/disbursements/account/validate?accountNumber={accountNumber}&bankCode={bankCode}`
* **Authorization**: `Bearer <accessToken>`
* **Response**:
  ```json
  {
    "requestSuccessful": true,
    "responseMessage": "success",
    "responseCode": "0",
    "responseBody": {
      "accountNumber": "0123456789",
      "accountName": "AYOBAMI ADELEKE",
      "bankCode": "058"
    }
  }
  ```

---

## 3. Initiating a Single Transfer

Transfers money from your merchant wallet to a destination bank account.

* **Endpoint**: `POST /api/v2/disbursements/single`
* **Authorization**: `Bearer <accessToken>`
* **Payload Parameters**:
  * `amount` *(number, required)*: Amount to disburse in standard currency units (e.g. `5000.00`).
  * `reference` *(string, required)*: Cryptographically unique reference for idempotency.
  * `narration` *(string, required)*: Description appearing on customer bank statement.
  * `destinationBankCode` *(string, required)*: 3-digit CBN bank code.
  * `destinationAccountNumber` *(string, required)*: 10-digit NUBAN account number.
  * `currency` *(string, required)*: `"NGN"`.
  * `sourceAccountNumber` *(string, required)*: Your Monnify wallet account number.
  * `twoFactorAuthCode` *(string, optional)*: Required if 2FA is activated on the wallet.

### Example Request
```http
POST /api/v2/disbursements/single HTTP/1.1
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "amount": 25000.00,
  "reference": "PAYOUT_20260906_9941",
  "narration": "Vendor Payment September",
  "destinationBankCode": "058",
  "destinationAccountNumber": "0123456789",
  "currency": "NGN",
  "sourceAccountNumber": "8081234567"
}
```

### Example Response
```json
{
  "requestSuccessful": true,
  "responseMessage": "success",
  "responseCode": "0",
  "responseBody": {
    "amount": 25000.00,
    "reference": "PAYOUT_20260906_9941",
    "status": "PENDING",
    "dateCreated": "2026-09-06T11:25:00.000+0000",
    "totalFee": 10.75,
    "destinationAccountName": "AYOBAMI ADELEKE",
    "destinationBankCode": "058",
    "destinationAccountNumber": "0123456789"
  }
}
```

---

## 4. Querying Transfer Status

* **Endpoint**: `GET /api/v2/disbursements/single/summary?reference={reference}`
* **Authorization**: `Bearer <accessToken>`
* **Possible Statuses**:
  * `SUCCESS`: Transfer completed and settled in recipient's account.
  * `PENDING`: Transfer is processing through NIBSS or the destination bank.
  * `FAILED`: Transfer could not be completed; funds are reversed back to your wallet.

---

## 5. Wallet Balance Enquiry

To monitor settlement balances before initiating disbursements:

* **Endpoint**: `GET /api/v2/disbursements/wallet-balance?accountNumber={sourceAccountNumber}`
* **Authorization**: `Bearer <accessToken>`
* **Response Body**: Returns `availableBalance`, `ledgerBalance`.

---

## 6. TypeScript Transfer Service
```typescript
import axios from 'axios';
import { MonnifyTokenManager } from './oauth_and_token_caching';

export interface PayoutRequest {
  amount: number;
  reference: string;
  narration: string;
  destinationBankCode: string;
  destinationAccountNumber: string;
  sourceAccountNumber: string;
}

export class MonnifyPayoutService {
  constructor(
    private tokenManager: MonnifyTokenManager,
    private baseUrl: string = 'https://sandbox.monnify.com'
  ) {}

  public async initiateTransfer(payout: PayoutRequest) {
    const token = await this.tokenManager.getAccessToken();

    const response = await axios.post(
      `${this.baseUrl}/api/v2/disbursements/single`,
      {
        ...payout,
        currency: 'NGN',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  public async checkTransferStatus(reference: string) {
    const token = await this.tokenManager.getAccessToken();

    const response = await axios.get(
      `${this.baseUrl}/api/v2/disbursements/single/summary?reference=${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.responseBody;
  }
}
```

