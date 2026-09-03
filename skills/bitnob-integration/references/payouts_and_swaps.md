# Payouts, Mobile Money & Swaps Guide

Bitnob enables local fiat payouts and real-time currency conversions, allowing applications to bridge crypto assets directly to local bank accounts and Mobile Money wallets across African markets.

---

## 1. Supported Countries & Payout Rails

| Country | Code | Currency | Supported Rails |
| :--- | :--- | :--- | :--- |
| **Nigeria** | `NG` | `NGN` | Commercial Banks (NUBAN) |
| **Ghana** | `GH` | `GHS` | Mobile Money (MTN, Vodafone, AirtelTigo) & Banks |
| **Kenya** | `KE` | `KES` | M-Pesa Mobile Money & Banks |
| **Rwanda** | `RW` | `RWF` | MTN Mobile Money & Airtel Money |

---

## 2. Listing Banks and Mobile Money Networks

Before initiating a payout, query the list of active institutions and routing codes:

```typescript
async function getBanks(countryCode: string) {
  const url = `https://api.bitnob.co/api/v1/payouts/banks?country=${encodeURIComponent(countryCode)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();
  return data.data; // Array of { code: string, name: string }
}
```

---

## 3. Initiating a Local Payout

```typescript
interface PayoutRequest {
  customerEmail: string;
  accountNumber: string; // Bank account number or Mobile Money phone number
  bankCode: string;      // Institution code from getBanks
  amount: number;        // Payout amount in major or minor units per currency
  currency: "NGN" | "GHS" | "KES" | "RWF" | "USD";
  reference: string;     // Unique idempotency reference
  narration?: string;
}

async function initiatePayout(payload: PayoutRequest) {
  const response = await fetch("https://api.bitnob.co/api/v1/payouts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!data.status) {
    throw new Error(`Payout initialization failed: ${data.message}`);
  }
  return data.data;
}
```

---

## 4. Currency Swaps & Conversions

Exchange balance between BTC, USD, and supported local fiat currencies in real-time:

```typescript
async function swapCurrency(fromCurrency: string, toCurrency: string, amount: number) {
  const response = await fetch("https://api.bitnob.co/api/v1/swap", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fromCurrency,
      toCurrency,
      amount
    })
  });

  const data = await response.json();
  return data.data;
}
```

---

## 5. Payout Lifecycle & Webhook Events

1. **Submitted**: The payout is validated and queued (`status: "pending"`).
2. **Settled**: Bank/MoMo rail confirms credit. Bitnob fires the `payout.successful` webhook.
3. **Failed / Rejected**: If the destination account number is invalid or bank rails reject the transfer, Bitnob fires the `payout.failed` webhook and refunds your balance.

