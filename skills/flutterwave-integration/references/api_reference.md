# Flutterwave API v3 Reference Guide

Comprehensive reference for the Flutterwave API v3 (`https://api.flutterwave.com/v3`).

---

## 1. Authentication & Base URLs

### Base URLs
- **Standard Base URL**: `https://api.flutterwave.com/v3`
- Both test and live requests use this base URL. The environment is determined entirely by the API keys supplied.

### API Keys
| Key Type | Format / Prefix | Scope / Placement |
| :--- | :--- | :--- |
| **Secret Key (Live)** | `FLWSECK_...` | Backend servers only (`Authorization: Bearer FLWSECK_...`) |
| **Secret Key (Test)** | `FLWSECK_TEST-...` | Backend sandbox testing |
| **Public Key (Live)** | `FLWPUBK_...` | Frontend / Client JS (`FlutterwaveCheckout(...)`) |
| **Public Key (Test)** | `FLWPUBK_TEST-...` | Frontend sandbox testing |
| **Secret Hash** | Custom alphanumeric | Webhook signature verification in request headers |
| **Encryption Key** | `FLWSECK_...` derived / Dashboard | Direct Card Charge payload encryption (3DES) |

### Standard Headers
```http
Authorization: Bearer FLWSECK_YOUR_SECRET_KEY
Content-Type: application/json
Accept: application/json
```

---

## 2. Standard Payments & Checkout

### Initialize Payment Link
Generates a hosted checkout payment link to redirect the customer to complete their transaction.

- **Method**: `POST`
- **Endpoint**: `/payments`
- **Full URL**: `https://api.flutterwave.com/v3/payments`

#### Request Payload
```json
{
  "tx_ref": "tx-cart-100293-8472",
  "amount": 15000,
  "currency": "NGN",
  "redirect_url": "https://yourapp.com/checkout/callback",
  "payment_options": "card,banktransfer,ussd,mobilemoneyghana",
  "meta": {
    "consumer_id": 23,
    "consumer_mac": "92a3-912a"
  },
  "customer": {
    "email": "customer@example.com",
    "phonenumber": "08012345678",
    "name": "Jane Doe"
  },
  "customizations": {
    "title": "Acme Superstore Checkout",
    "description": "Payment for Cart #100293",
    "logo": "https://yourapp.com/assets/logo.png"
  }
}
```

#### Key Request Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `tx_ref` | String | **Yes** | Unique merchant transaction reference. |
| `amount` | Number | **Yes** | Amount in **major currency units** (e.g. `15000` for ₦15,000, `25.50` for $25.50). |
| `currency` | String | **Yes** | 3-letter ISO currency code (`NGN`, `USD`, `KES`, `GHS`, `ZAR`, etc.). |
| `redirect_url` | String | **Yes** | URL to redirect customer upon payment completion or cancellation. |
| `customer` | Object | **Yes** | Contains customer `email` (required), `name`, and `phonenumber`. |
| `payment_options` | String | No | Comma-separated payment methods (e.g., `card,banktransfer,ussd`). |
| `subaccounts` | Array | No | Subaccounts for split payments. |
| `customizations` | Object | No | Brand customization (`title`, `description`, `logo`). |

#### Response (`200 OK`)
```json
{
  "status": "success",
  "message": "Hosted link generator",
  "data": {
    "link": "https://checkout.flutterwave.com/v3/hosted/pay/4839201948201"
  }
}
```

---

## 3. Transaction Verification

### Verify Transaction by ID
Used to verify the final settlement status of a transaction on your server after redirect or webhook.

- **Method**: `GET`
- **Endpoint**: `/transactions/{id}/verify`
- **Full URL**: `https://api.flutterwave.com/v3/transactions/288200108/verify`

#### Response (`200 OK`)
```json
{
  "status": "success",
  "message": "Transaction fetched successfully",
  "data": {
    "id": 288200108,
    "tx_ref": "tx-cart-100293-8472",
    "flw_ref": "FLW-MOCK-100004260420",
    "device_fingerprint": "N/A",
    "amount": 15000,
    "currency": "NGN",
    "charged_amount": 15000,
    "app_fee": 210,
    "merchant_fee": 0,
    "processor_response": "Approved",
    "auth_model": "PIN",
    "ip": "102.176.65.1",
    "narration": "Acme Superstore Checkout",
    "status": "successful",
    "payment_type": "card",
    "created_at": "2026-11-12T14:30:14.000Z",
    "account_id": 84920,
    "card": {
      "first_6digits": "537728",
      "last_4digits": "7450",
      "issuer": "MASTERCARD",
      "country": "NG",
      "type": "MASTERCARD",
      "token": "flw-t1nf-264db944ee46d0a2627573a496f5432c-m03k",
      "expiry": "09/32"
    },
    "customer": {
      "id": 1507191,
      "name": "Jane Doe",
      "phone_number": "08012345678",
      "email": "customer@example.com",
      "created_at": "2026-11-12T14:28:15.000Z"
    }
  }
}
```

### Verify by Merchant Reference (`tx_ref`)
- **Method**: `GET`
- **Endpoint**: `/transactions/verify_by_reference?tx_ref={tx_ref}`

---

## 4. Tokenized Charges (Recurring Billing)

Charges a previously stored card token for automated recurring billing or one-click checkouts.

- **Method**: `POST`
- **Endpoint**: `/tokenized-charges`

#### Request Payload
```json
{
  "token": "flw-t1nf-264db944ee46d0a2627573a496f5432c-m03k",
  "currency": "NGN",
  "country": "NG",
  "amount": 2000,
  "email": "customer@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "tx_ref": "tx-sub-month-2026-11",
  "narration": "Monthly Pro Subscription"
}
```

*Note: The `email` must match the exact email address used when the token was originally generated.*

---

## 5. Bank Account Resolution & Banks List

### Resolve Bank Account (NUBAN)
Validates a destination bank account number and returns the registered account holder's name.

- **Method**: `POST`
- **Endpoint**: `/accounts/resolve`

#### Request Payload
```json
{
  "account_number": "0690000032",
  "account_bank": "044"
}
```

#### Response (`200 OK`)
```json
{
  "status": "success",
  "message": "Account details fetched",
  "data": {
    "account_number": "0690000032",
    "account_name": "JANE DOE"
  }
}
```

### List Banks by Country
Fetches the list of bank institutions and their corresponding bank codes.

- **Method**: `GET`
- **Endpoint**: `/banks/{country}` (e.g. `/banks/NG`, `/banks/GH`, `/banks/KE`)

---

## 6. Transfers & Outbound Disbursements

### Initiate Outbound Transfer
Disburses funds from your Flutterwave balance to a bank account or mobile wallet.

- **Method**: `POST`
- **Endpoint**: `/transfers`

#### Request Payload
```json
{
  "account_bank": "044",
  "account_number": "0690000032",
  "amount": 5000,
  "currency": "NGN",
  "narration": "November Merchant Settlement",
  "reference": "payout-ref-84920412",
  "debit_currency": "NGN"
}
```

### Check Transfer Fee
Fetches the applicable fee for a transfer before initiating it.

- **Method**: `GET`
- **Endpoint**: `/transfers/fee?amount=5000&currency=NGN`

### Initiate Bulk Transfers
Disburses to multiple recipients in a single API call.

- **Method**: `POST`
- **Endpoint**: `/bulk-transfers`

#### Request Payload
```json
{
  "title": "Vendor Batch Payouts Nov 2026",
  "bulk_data": [
    {
      "account_bank": "044",
      "account_number": "0690000032",
      "amount": 15000,
      "currency": "NGN",
      "narration": "Vendor payout 1",
      "reference": "bulk-vendor-1-1001"
    },
    {
      "account_bank": "058",
      "account_number": "0123456789",
      "amount": 25000,
      "currency": "NGN",
      "narration": "Vendor payout 2",
      "reference": "bulk-vendor-2-1002"
    }
  ]
}
```

---

## 7. Dedicated Virtual Accounts (DVA)

### Create Virtual Account (Static / Permanent)
Generates dedicated bank virtual account details for customer deposits and automated wallet funding.

- **Method**: `POST`
- **Endpoint**: `/virtual-account-numbers`

#### Request Payload
```json
{
  "email": "customer@example.com",
  "is_permanent": true,
  "bvn": "12345678901",
  "tx_ref": "va-cust-2901-wallet",
  "phonenumber": "08012345678",
  "firstname": "Jane",
  "lastname": "Doe",
  "narration": "Jane Doe Wallet"
}
```

#### Response (`200 OK`)
```json
{
  "status": "success",
  "message": "Virtual account created",
  "data": {
    "response_code": "02",
    "response_message": "Transaction in progress",
    "flw_ref": "FLW-VA-9842019482",
    "order_ref": "URF_1603920194820",
    "account_number": "9930219482",
    "frequency": "NA",
    "bank_name": "WEMA BANK",
    "created_at": "2026-11-12T14:40:00.000Z",
    "expiry_date": "NA",
    "note": "Please transfer exact amount"
  }
}
```

---

## 8. Subaccounts (Split Payments)

### Create Subaccount
Configures a vendor subaccount to split payments received on checkout.

- **Method**: `POST`
- **Endpoint**: `/subaccounts`

#### Request Payload
```json
{
  "account_bank": "044",
  "account_number": "0690000032",
  "business_name": "Alpha Vendor Store",
  "business_email": "vendor@alpha.com",
  "business_contact": "Jane Alpha",
  "business_contact_mobile": "08012345678",
  "business_mobile": "08012345678",
  "country": "NG",
  "split_type": "percentage",
  "split_value": 0.20
}
```

*For flat splits: set `"split_type": "flat"` and `"split_value": 500` (for ₦500).*

---

## 9. Refunds

### Initiate Refund
Refunds a settled transaction back to the customer's source account or card.

- **Method**: `POST`
- **Endpoint**: `/transactions/{id}/refund`

#### Request Payload
```json
{
  "amount": 5000,
  "comments": "Customer requested order cancellation"
}
```
*(If `amount` is omitted, the full transaction amount is refunded).*
