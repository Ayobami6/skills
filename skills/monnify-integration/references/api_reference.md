# Monnify API Quick Reference

Complete reference table for all major endpoints supported by the Monnify REST API.

---

## 1. Authentication

| Method | Endpoint | Description | Auth Type |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Exchange API Key & Secret Key for JWT Access Token | Basic `base64(apiKey:secretKey)` |

---

## 2. Dedicated & Reserved Accounts

| Method | Endpoint | Description | Auth Type |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v2/bank-transfer/reserved-accounts` | Provision dedicated virtual account(s) for a customer | Bearer `<accessToken>` |
| `GET` | `/api/v2/bank-transfer/reserved-accounts/{accountReference}` | Get details of a reserved account | Bearer `<accessToken>` |
| `PUT` | `/api/v1/bank-transfer/reserved-accounts/{accountReference}/kyc-info` | Update customer BVN/NIN for a reserved account | Bearer `<accessToken>` |
| `DELETE` | `/api/v1/bank-transfer/reserved-accounts/{accountReference}` | Deallocate/delete a reserved virtual account | Bearer `<accessToken>` |
| `GET` | `/api/v1/bank-transfer/reserved-accounts/transactions` | Query transaction history for a reserved account | Bearer `<accessToken>` |

---

## 3. Dynamic Bank Transfers

| Method | Endpoint | Description | Auth Type |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/merchant/bank-transfer/init-payment` | Generate an ephemeral one-time virtual account for an invoice | Bearer `<accessToken>` |

---

## 4. Standard Transactions & Checkout

| Method | Endpoint | Description | Auth Type |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/merchant/transactions/init-transaction` | Initialize a transaction for Web/Mobile checkout | Bearer `<accessToken>` |
| `GET` | `/api/v2/transactions/{transactionReference}` | Fetch transaction status by Monnify transaction reference | Bearer `<accessToken>` |
| `GET` | `/api/v2/merchant/transactions/query` | Fetch transaction status by merchant payment reference | Bearer `<accessToken>` |
| `POST` | `/api/v1/merchant/transactions/refund` | Initiate a refund for an authorized transaction | Bearer `<accessToken>` |

---

## 5. Disbursements & Payouts

| Method | Endpoint | Description | Auth Type |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v2/disbursements/single` | Initiate a single transfer to any Nigerian bank | Bearer `<accessToken>` |
| `POST` | `/api/v2/disbursements/batch` | Initiate batch/bulk transfers | Bearer `<accessToken>` |
| `GET` | `/api/v2/disbursements/single/summary` | Query status of a single disbursement | Bearer `<accessToken>` |
| `GET` | `/api/v2/disbursements/wallet-balance` | Fetch merchant disbursement wallet balance | Bearer `<accessToken>` |
| `GET` | `/api/v1/disbursements/account/validate` | Verify NUBAN account name and bank code | Bearer `<accessToken>` |
| `GET` | `/api/v1/banks` | List all supported financial institutions and bank codes | Bearer `<accessToken>` |

---

## 6. Sub-Accounts & Split Payments

| Method | Endpoint | Description | Auth Type |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/sub-accounts` | Create a sub-account for split payments | Bearer `<accessToken>` |
| `GET` | `/api/v1/sub-accounts` | List all registered sub-accounts | Bearer `<accessToken>` |
| `DELETE` | `/api/v1/sub-accounts/{subAccountCode}` | Delete/deactivate a sub-account | Bearer `<accessToken>` |

---

## 7. Webhook Payload Structure

Sample inbound payload for `SUCCESSFUL_TRANSACTION`:

```json
{
  "eventType": "SUCCESSFUL_TRANSACTION",
  "eventData": {
    "product": {
      "reference": "user_wallet_98234",
      "type": "RESERVED_ACCOUNT"
    },
    "transactionReference": "MNFY|15|202609061120|0001",
    "paymentReference": "MNFY|15|202609061120|0001",
    "paidOn": "06/09/2026 11:20:15 AM",
    "paymentCycle": "ONE_TIME",
    "amountPaid": 10000.00,
    "totalPayable": 10000.00,
    "settlementAmount": 9850.00,
    "paymentStatus": "PAID",
    "paymentMethod": "ACCOUNT_TRANSFER",
    "currency": "NGN",
    "customer": {
      "email": "customer@example.com",
      "name": "Ayobami Adeleke"
    },
    "destinationAccountInformation": {
      "bankCode": "035",
      "bankName": "Wema Bank",
      "accountNumber": "9912345678"
    }
  },
  "transactionHash": "e840a45e0d..."
}
```

