# Dedicated Virtual Accounts & Split Payments Guide

This guide covers Dedicated Virtual Accounts (DVA) for customer deposits and Subaccounts for automated marketplace split payments.

---

## 1. Dedicated Virtual Accounts (DVA)

Flutterwave Dedicated Virtual Accounts allow you to provision real bank account numbers (e.g. Wema Bank, Sterling Bank) for your customers. Inbound bank transfers automatically trigger webhooks to fund user wallets.

### Permanent vs. Dynamic Virtual Accounts

| Feature | Static / Permanent Virtual Account | Dynamic / Temporary Virtual Account |
| :--- | :--- | :--- |
| **`is_permanent`** | `true` | `false` |
| **Primary Use Case** | Customer wallet funding, personal account mapping. | One-time cart checkouts via direct bank transfer. |
| **KYC Requirement** | **BVN mandatory** (for live Nigerian NGN accounts). | None (can be created per checkout session). |
| **Account Expiry** | Does not expire. | Expires after specified duration (e.g., 1 hour). |
| **Amount Enforcement** | Any transfer amount is accepted. | Expects exact order amount. |

---

### Creating a Static Virtual Account (TypeScript)

```typescript
import axios from 'axios';

export async function createPermanentVirtualAccount(params: {
  email: string;
  bvn: string; // 11-digit BVN
  firstName: string;
  lastName: string;
  phoneNumber: string;
  txRef: string;
  narration?: string;
}) {
  const response = await axios.post(
    'https://api.flutterwave.com/v3/virtual-account-numbers',
    {
      email: params.email,
      is_permanent: true,
      bvn: params.bvn,
      tx_ref: params.txRef,
      phonenumber: params.phoneNumber,
      firstname: params.firstName,
      lastname: params.lastName,
      narration: params.narration ?? `${params.firstName} ${params.lastName} Wallet`,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = response.data;
  if (data.status !== 'success') {
    throw new Error(`Virtual account creation failed: ${data.message}`);
  }

  return {
    accountNumber: data.data.account_number,
    bankName: data.data.bank_name,
    flwRef: data.data.flw_ref,
    orderRef: data.data.order_ref,
  };
}
```

---

### Reconciling Virtual Account Deposits via Webhook

When a customer transfers money into their assigned virtual account:
1. Flutterwave sends a `charge.completed` webhook.
2. In the payload, inspect:
   - `data.payment_type`: `"bank_transfer"`
   - `data.customer.email`: Matches the customer's registered email
   - `data.amount`: Amount deposited in major units
   - `data.status`: `"successful"`
3. Verify the transaction by calling `GET /v3/transactions/:id/verify`.
4. Atomically credit the customer's balance within a database transaction.

---

## 2. Subaccounts & Split Payments

Subaccounts allow multi-vendor platforms and marketplaces to automatically split payments between the primary merchant account and one or more third-party sellers.

### Step 1: Create a Subaccount for a Vendor

```http
POST https://api.flutterwave.com/v3/subaccounts
Authorization: Bearer FLWSECK_...
Content-Type: application/json

{
  "account_bank": "044",
  "account_number": "0690000032",
  "business_name": "Gadget Store Alpha",
  "business_email": "gadgets@alpha.com",
  "business_contact": "Alex Vendor",
  "business_contact_mobile": "08012345678",
  "business_mobile": "08012345678",
  "country": "NG",
  "split_type": "percentage",
  "split_value": 0.85
}
```

#### Split Configuration Rules:
- **`split_type: "percentage"`**: The subaccount receives a percentage share of the transaction. The `split_value` is expressed as a decimal (`0.85` = 85% to vendor, 15% retained by platform).
- **`split_type: "flat"`**: The subaccount receives a flat fixed currency amount (e.g. `split_value: 1500` for ₦1,500).

#### Response (`200 OK`)
```json
{
  "status": "success",
  "message": "Subaccount created",
  "data": {
    "id": 14920,
    "subaccount_id": "RS_B1F8E10948A20412",
    "account_number": "0690000032",
    "account_bank": "044",
    "full_name": "JOHN DOE",
    "business_name": "Gadget Store Alpha",
    "split_type": "percentage",
    "split_value": 0.85,
    "created_at": "2026-11-12T15:20:00.000Z"
  }
}
```

---

### Step 2: Splitting Transactions on Hosted Checkout

When initializing a transaction via `POST /v3/payments`, supply the `subaccounts` array to distribute proceeds automatically:

```json
{
  "tx_ref": "tx-marketplace-cart-84920",
  "amount": 20000,
  "currency": "NGN",
  "redirect_url": "https://marketplace.com/checkout/callback",
  "customer": {
    "email": "buyer@example.com"
  },
  "subaccounts": [
    {
      "id": "RS_B1F8E10948A20412",
      "transaction_charge_type": "flat_subaccount",
      "transaction_charge": 16000
    }
  ]
}
```

In this example:
- Buyer pays: ₦20,000
- Vendor (`RS_B1F8E10948A20412`) receives: ₦16,000
- Marketplace platform retains: ₦4,000 (minus payment processing fees)
