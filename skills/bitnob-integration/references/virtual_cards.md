# Virtual USD Debit Cards Integration

Bitnob enables platforms to issue and manage Visa/Mastercard virtual dollar debit cards. Users can spend globally at online merchants (e.g. AWS, Apple, Netflix, Google, Shopify).

---

## 1. Prerequisites: Customer KYC Registration

A valid customer profile is required prior to issuing a virtual card.

### Register Customer (`POST /customers`)
```typescript
interface CustomerPayload {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryCode: string; // ISO 2-letter, e.g. "NG", "GH", "KE", "US"
  idType?: "BVN" | "NIN" | "PASSPORT" | "DRIVERS_LICENSE";
  idNumber?: string;
  dateOfBirth: string; // "YYYY-MM-DD"
  line1: string;
  city: string;
  state: string;
  zipCode: string;
}

async function createCustomer(payload: CustomerPayload) {
  const response = await fetch("https://api.bitnob.co/api/v1/customers", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const resData = await response.json();
  if (!resData.status) throw new Error(resData.message);
  return resData.data.id; // Customer ID
}
```

---

## 2. Card Issuance (`POST /cards/virtual`)

Once the customer profile is created, issue a virtual card with an initial balance:

```typescript
async function issueVirtualCard(customerId: string, initialAmountCents: number) {
  const response = await fetch("https://api.bitnob.co/api/v1/cards/virtual", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      customerId,
      currency: "USD",
      amount: initialAmountCents, // e.g. 5000 for $50.00
      brand: "visa"
    })
  });

  const resData = await response.json();
  return resData.data;
}
```

---

## 3. Card Lifecycle Management

### Funding a Card (`POST /cards/virtual/{cardId}/fund`)
Transfers balance from your business Bitnob balance into the cardholder's virtual card:
```typescript
async function fundCard(cardId: string, amountCents: number) {
  const response = await fetch(`https://api.bitnob.co/api/v1/cards/virtual/${cardId}/fund`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount: amountCents })
  });
  return await response.json();
}
```

### Withdrawing from Card (`POST /cards/virtual/{cardId}/withdraw`)
Offloads unused card balance back to the platform wallet:
```typescript
async function withdrawCardBalance(cardId: string, amountCents: number) {
  const response = await fetch(`https://api.bitnob.co/api/v1/cards/virtual/${cardId}/withdraw`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount: amountCents })
  });
  return await response.json();
}
```

### Freezing & Unfreezing
Allows cardholders or security automations to temporarily lock/unlock card usage:
```typescript
async function toggleCardStatus(cardId: string, action: "freeze" | "unfreeze") {
  const response = await fetch(`https://api.bitnob.co/api/v1/cards/virtual/${cardId}/${action}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    }
  });
  return await response.json();
}
```

---

## 4. Querying Card Transactions & Statements

Track debits, declines, authorizations, and refunds on issued cards:

```typescript
async function getCardTransactions(cardId: string) {
  const response = await fetch(`https://api.bitnob.co/api/v1/cards/virtual/${cardId}/transactions`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    }
  });
  const data = await response.json();
  return data.data;
}
```

---

## 5. Security & PCI-DSS Considerations
- **Masked Display**: Only show the last 4 digits of the PAN on list views (`•••• •••• •••• 1234`).
- **Reveal on Demand**: Provide a dedicated authenticated endpoint / modal when the user requests to see full CVV and PAN.
- **Webhook Events**: Listen for `virtualcard.transaction` webhooks to notify users in real-time when online card purchases succeed or get declined (e.g. insufficient balance).

