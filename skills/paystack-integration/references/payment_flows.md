# Paystack Payment Flows & Implementation Guide

This guide details the core payment integration patterns: Server-to-Server Checkout, Client-Side Inline Popups, and Tokenized Recurring Billing.

---

## 1. Server-to-Server Checkout Flow (Redirect Mode)

Best for web applications wanting a secure, hosted checkout experience without client-side JavaScript SDK dependencies.

### TypeScript / Node.js Implementation
```typescript
import axios from 'axios';
import crypto from 'crypto';

interface InitializeParams {
  email: string;
  amountInMainUnit: number; // e.g., 50.00
  currency?: 'NGN' | 'GHS' | 'USD' | 'ZAR' | 'KES';
  callbackUrl: string;
  metadata?: Record<string, any>;
}

export class PaystackService {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;

  constructor(secretKey: string = process.env.PAYSTACK_SECRET_KEY!) {
    if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is required');
    this.secretKey = secretKey;
  }

  async initializeTransaction(params: InitializeParams) {
    const reference = `ref_${crypto.randomUUID()}`;
    const amountInSubunits = Math.round(params.amountInMainUnit * 100);

    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      {
        email: params.email,
        amount: amountInSubunits,
        currency: params.currency ?? 'NGN',
        reference,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      authorizationUrl: response.data.data.authorization_url as string,
      accessCode: response.data.data.access_code as string,
      reference,
    };
  }

  async verifyTransaction(reference: string) {
    const response = await axios.get(
      `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      }
    );

    const data = response.data.data;
    const isSuccessful = data.status === 'success';

    return {
      success: isSuccessful,
      amountInMainUnit: data.amount / 100,
      currency: data.currency,
      customerEmail: data.customer.email,
      authorizationCode: data.authorization?.reusable
        ? data.authorization.authorization_code
        : null,
      raw: data,
    };
  }
}
```

---

## 2. Client-Side Popup Flow (Paystack Inline JS)

Allows users to complete payment directly on your page without leaving your website.

### Frontend HTML / Vanilla JS
```html
<script src="https://js.paystack.co/v1/inline.js"></script>

<button type="button" onclick="payWithPaystack()">Pay with Paystack</button>

<script>
  function payWithPaystack() {
    const handler = PaystackPop.setup({
      key: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx', // Public Key
      email: 'customer@email.com',
      amount: 500000, // ₦5,000 in kobo
      currency: 'NGN',
      ref: 'inline_ref_' + Math.floor((Math.random() * 1000000000) + 1),
      onClose: function() {
        alert('Transaction window closed.');
      },
      callback: function(response) {
        // Send response.reference to your server for verification
        fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: response.reference })
        }).then(res => res.json()).then(data => {
          if (data.success) {
            window.location.href = '/checkout/success';
          }
        });
      }
    });

    handler.openIframe();
  }
</script>
```

---

## 3. Recurring Tokenized Charges (Card-on-File)

After a customer completes a card transaction, Paystack returns an `authorization` object containing a reusable `authorization_code`.

### Re-charging Stored Card
```python
import httpx
import os

PAYSTACK_SECRET = os.getenv("PAYSTACK_SECRET_KEY")

async def charge_customer_card(authorization_code: str, email: str, amount_in_kobo: int, reference: str):
    url = "https://api.paystack.co/transaction/charge_authorization"
    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET}",
        "Content-Type": "application/json"
    }
    payload = {
        "authorization_code": authorization_code,
        "email": email,
        "amount": amount_in_kobo,
        "reference": reference
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        result = response.json()
        
        if result.get("status") and result["data"]["status"] == "success":
            return {"success": True, "transaction_id": result["data"]["id"]}
        else:
            return {"success": False, "message": result.get("message")}
```

