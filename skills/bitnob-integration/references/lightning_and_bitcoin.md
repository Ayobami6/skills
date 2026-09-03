# Lightning Network & On-Chain Bitcoin Guide

Bitnob offers dual-rail Bitcoin support:
1. **Lightning Network (L2)**: Instant settlement, fractions of a cent in fees, ideal for point-of-sale, streaming payments, and microtransactions.
2. **On-Chain Bitcoin (L1)**: High-assurance settlement directly on the Bitcoin blockchain, suitable for large transfers, cold storage deposits, and treasury management.

---

## 1. Lightning Network Invoices (Inbound / Receiving)

### Creating an Invoice
When your user wants to pay via Lightning, create a BOLT11 invoice:

```typescript
async function createLightningInvoice(customerEmail: string, satoshis: number, description: string) {
  const response = await fetch("https://api.bitnob.co/api/v1/wallets/ln/createinvoice", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      customerEmail,
      satoshis,
      description,
      expiresIn: 3600 // 1 hour
    })
  });

  const data = await response.json();
  // data.data.payment_request is the BOLT11 invoice string (e.g. lnbc...)
  return data.data;
}
```

### QR Code Generation
In your frontend, display the `payment_request` either as text (clickable to copy or open in lightning wallets) or render it into a QR code using standard QR libraries.

---

## 2. Paying Lightning Invoices (Outbound / Sending)

### Step 1: Decode Before Paying (Safety Check)
Before paying an arbitrary invoice, decode it to verify the amount and description:

```typescript
async function decodeInvoice(bolt11Invoice: string) {
  const response = await fetch("https://api.bitnob.co/api/v1/wallets/ln/decodepayreq", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ request: bolt11Invoice })
  });

  return await response.json();
}
```

### Step 2: Pay the Invoice
```typescript
async function payLightningInvoice(bolt11Invoice: string, reference: string, customerEmail: string) {
  const response = await fetch("https://api.bitnob.co/api/v1/wallets/ln/pay", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      request: bolt11Invoice,
      reference,
      customerEmail
    })
  });

  return await response.json();
}
```

---

## 3. On-Chain Bitcoin (Addresses & Transfers)

### Generating a Bitcoin Address
You can generate unique on-chain Bitcoin addresses linked to specific users or orders:

```typescript
async function generateBtcAddress(customerEmail: string, label: string) {
  const response = await fetch("https://api.bitnob.co/api/v1/addresses/generate", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      customerEmail,
      label
    })
  });

  const data = await response.json();
  return data.data.address;
}
```

### Sending On-Chain Bitcoin
Specify network fee priority when broadcasting an on-chain transaction:
- `slow`: Target ~6+ blocks (economic).
- `medium`: Target ~3 blocks (balanced).
- `fast`: Target next 1-2 blocks (urgent).

```typescript
async function sendBtc(address: string, satoshis: number, customerEmail: string, priority: "slow" | "medium" | "fast" = "medium") {
  const response = await fetch("https://api.bitnob.co/api/v1/wallets/btc/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.BITNOB_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      address,
      satoshis,
      customerEmail,
      priority
    })
  });

  return await response.json();
}
```

---

## 4. Best Practices for Bitcoin Operations

1. **Satoshis vs BTC Units**:
   - 1 BTC = `100,000,000` satoshis.
   - Always operate in integer satoshis within internal accounting systems to prevent floating point inaccuracies.
2. **Handle Re-orgs & Confirmations**:
   - For on-chain BTC, wait for 1-3 network confirmations before granting high-value non-reversible goods.
   - Lightning Network payments are instantaneous and final upon `lightning.success` webhook receipt.
3. **Store Invoice Hashes**:
   - Always persist `r_hash` and `payment_request` alongside customer order records.

