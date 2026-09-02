# Paystack API Reference & Endpoints Guide

**Base URL**: `https://api.paystack.co`  
**Headers**:
```http
Authorization: Bearer YOUR_SECRET_KEY
Content-Type: application/json
```

---

## 1. Transactions API

### Initialize Transaction
`POST /transaction/initialize`

Creates a payment session and returns an authorization URL.

```json
// Request Body
{
  "email": "customer@example.com",
  "amount": 500000,
  "currency": "NGN",
  "reference": "order_ref_982347102",
  "callback_url": "https://myapp.com/payment/callback",
  "metadata": {
    "cart_id": "cart_123",
    "custom_fields": [
      {
        "display_name": "Order ID",
        "variable_name": "order_id",
        "value": "ORD-991"
      }
    ]
  },
  "channels": ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"]
}
```

```json
// Response (200 OK)
{
  "status": true,
  "message": "Authorization URL created",
  "data": {
    "authorization_url": "https://checkout.paystack.com/0peioxfhpn",
    "access_code": "0peioxfhpn",
    "reference": "order_ref_982347102"
  }
}
```

### Verify Transaction
`GET /transaction/verify/:reference`

Checks the confirmed status and payment details of a transaction.

```json
// Response (200 OK)
{
  "status": true,
  "message": "Verification successful",
  "data": {
    "id": 293847291,
    "domain": "live",
    "status": "success",
    "reference": "order_ref_982347102",
    "amount": 500000,
    "gateway_response": "Successful",
    "paid_at": "2026-09-02T14:30:00.000Z",
    "channel": "card",
    "currency": "NGN",
    "customer": {
      "id": 847291,
      "email": "customer@example.com",
      "customer_code": "CUS_8392019"
    },
    "authorization": {
      "authorization_code": "AUTH_839201928",
      "bin": "408408",
      "last4": "4081",
      "exp_month": "12",
      "exp_year": "2030",
      "channel": "card",
      "card_type": "visa",
      "bank": "TEST BANK",
      "reusable": true,
      "signature": "SIG_839201928"
    }
  }
}
```

### Charge Stored Authorization (Recurring Billing)
`POST /transaction/charge_authorization`

```json
{
  "authorization_code": "AUTH_839201928",
  "email": "customer@example.com",
  "amount": 250000,
  "reference": "rec_sub_839201923"
}
```

---

## 2. Transfers & Payouts API

### Resolve Bank Account (NUBAN Verification)
`GET /bank/resolve?account_number=0123456789&bank_code=058`

```json
// Response (200 OK)
{
  "status": true,
  "message": "Account number resolved",
  "data": {
    "account_number": "0123456789",
    "account_name": "JOHN DOE",
    "bank_id": 9
  }
}
```

### Create Transfer Recipient
`POST /transferrecipient`

```json
{
  "type": "nuban",
  "name": "JOHN DOE",
  "account_number": "0123456789",
  "bank_code": "058",
  "currency": "NGN"
}
```

```json
// Response (201 Created)
{
  "status": true,
  "message": "Transfer recipient created",
  "data": {
    "recipient_code": "RCP_2x5j678901234",
    "name": "JOHN DOE",
    "details": {
      "account_number": "0123456789",
      "bank_code": "058",
      "bank_name": "Guaranty Trust Bank"
    }
  }
}
```

### Initiate Transfer
`POST /transfer`

```json
{
  "source": "balance",
  "amount": 100000,
  "reference": "payout_ref_391029",
  "recipient": "RCP_2x5j678901234",
  "reason": "Affiliate earnings payout"
}
```

---

## 3. Dedicated Virtual Accounts API

### Assign Dedicated Virtual Account
`POST /dedicated_account`

```json
{
  "customer": "CUS_8392019",
  "preferred_bank": "wema-bank"
}
```

```json
// Response (200 OK)
{
  "status": true,
  "message": "Dedicated account assigned",
  "data": {
    "bank": {
      "name": "Wema Bank",
      "id": 20
    },
    "account_name": "Paystack / John Doe",
    "account_number": "9938291029",
    "assigned": true,
    "currency": "NGN"
  }
}
```

---

## 4. Subscriptions & Plans API

### Create Plan
`POST /plan`

```json
{
  "name": "Monthly Pro Plan",
  "interval": "monthly",
  "amount": 1000000
}
```

### Create Subscription
`POST /subscription`

```json
{
  "customer": "customer@example.com",
  "plan": "PLN_gx2xp37ndekqg12",
  "authorization": "AUTH_839201928"
}
```

---

## 5. Splits & Marketplace Subaccounts

### Create Subaccount
`POST /subaccount`

```json
{
  "business_name": "Merchant Store A",
  "settlement_bank": "058",
  "account_number": "0123456789",
  "percentage_charge": 10
}
```

