# Obiex Collections & Deposits Guide

This guide covers on-ramping and payment collection using Obiex. Obiex provides two complementary collection mechanisms:
1. **Crypto Wallet Collections**: Generating unique multi-chain crypto wallet addresses for end customers.
2. **Multi-Customer Business Collections**: Issuing dynamic virtual bank accounts for collecting Nigerian Naira (NGN) with automated BVN/NIN KYC name matching and crypto settlement.

---

## Part 1: Cryptocurrency Wallet Collections

### 1. Pre-Flight Check: Verify Network Receivable Status
Before generating an address for a specific currency/network pair, you must verify that the network is actively accepting deposits (`isReceivable: true`).

```http
GET /v1/currencies/networks/active
```

If `isReceivable` is `false`, do not prompt the user for deposit; attempt an alternative network or alert the customer that the network is under maintenance.

### 2. Generating Crypto Deposit Addresses (`POST /addresses/broker`)

- **Endpoint**: `POST /v1/addresses/broker`
- **Request Parameters**:
  - `uniqueUserIdentifier`: A stable identifier representing your customer (e.g. `usr_817294`).
  - `currency`: System currency code (e.g., `USDT`, `BTC`, `ETH`).
  - `network`: System network code (e.g., `TRX`, `BSC`, `BTC`, `ETH`).

#### Idempotency Rule (`uniqueUserIdentifier`)
- **First Call**: Generates a new blockchain address mapped to `uniqueUserIdentifier`.
- **Subsequent Calls**: Passing the identical `uniqueUserIdentifier` returns the **same address** rather than consuming a new one.
- **Cross-Currency Consistency**: Use the same `uniqueUserIdentifier` for a customer across all currencies and networks.

#### Example Request Payload
```json
{
  "uniqueUserIdentifier": "user-d8721c-99a4",
  "currency": "USDT",
  "network": "TRX"
}
```

#### Example Response
```json
{
  "address": "TNPwF88VzW5CjXpWw9tP8YmYhYw9876543",
  "currency": "USDT",
  "network": "TRX",
  "memo": null,
  "uniqueUserIdentifier": "user-d8721c-99a4"
}
```

> [!NOTE]
> For networks requiring destination tags or memos (such as XRP or TON), the response includes the `memo` string. You must display both the `address` and `memo` to the user.

---

## Part 2: Multi-Customer Business Collections (Fiat Virtual Accounts)

Business Collections allows organizations to collect fiat payments (NGN) directly from distinct customers (for commerce, marketplace orders, or rentals) without manual bank statement reconciliation.

### How Business Collections Works
1. **Customer KYC**: The merchant collects the customer's legal name, BVN, and/or NIN.
2. **Issue Dynamic Virtual Account**: Call `POST /collections` to generate a dedicated virtual account tied to the customer, expected amount, and a **30-minute validity window**.
3. **Customer Transfers Funds**: The customer transfers local currency via their mobile banking app.
4. **Automated Name Matching & Settlement**:
   - **Exact Match**: When the sender account name matches the registered KYC details, Obiex automatically converts the fiat into `USDT` (or `USDC`) at the locked rate and credits your wallet.
   - **Mismatch**: If a third-party account or alias was used, the transaction is flagged and placed in escrow/review to prevent fraud.
5. **Webhook Dispatch**: A `type: "COLLECTION"` webhook is fired upon settlement.

### Create Collection Payload (`POST /collections`)
```json
{
  "amount": 75000,
  "sourceCurrency": "NGNX",
  "targetCurrency": "USDT",
  "customer": {
    "firstName": "Emeka",
    "lastName": "Okafor",
    "email": "emeka.okafor@example.com",
    "phoneNumber": "08098765432",
    "bvn": "22234567890",
    "nin": "12345678901"
  }
}
```

### Response Payload
```json
{
  "collectionId": "col_76ab91-23fe-4411",
  "accountNumber": "9938271012",
  "accountName": "Obiex / Emeka Okafor",
  "bankName": "Wema Bank",
  "bankCode": "035",
  "amountExpected": 75000,
  "sourceCurrency": "NGNX",
  "targetCurrency": "USDT",
  "expiresAt": "2026-11-14T11:00:00Z"
}
```

---

## 3. Code Implementations

### TypeScript / Node.js
```typescript
import { ObiexClient } from 'obiex-api';

const client = new ObiexClient({
  apiKey: process.env.OBIEX_API_KEY!,
  apiSecret: process.env.OBIEX_API_SECRET!,
  sandboxMode: false,
});

/**
 * Generates or retrieves an existing deposit address for a customer.
 */
export async function getOrCreateCryptoDepositAddress(
  userId: string,
  currency: string,
  network: string
) {
  // 1. Verify active networks
  const activeNetworks = await client.getTradableCurrencies();
  
  // 2. Request address via broker endpoint
  const address = await client.createDepositAddress({
    uniqueUserIdentifier: userId,
    currency,
    network,
  });

  return {
    address: address.address,
    currency: address.currency,
    network: address.network,
    memo: address.memo,
  };
}
```

### Python
```python
from typing import Dict, Any, Optional
from .client import ObiexClient

def generate_deposit_address(
    client: ObiexClient,
    user_id: str,
    currency: str,
    network: str,
) -> Dict[str, Any]:
    # 1. Pre-flight check
    active_networks = client.get("/v1/currencies/networks/active")
    currency_networks = active_networks.get(currency, [])
    
    target_network = next(
        (n for n in currency_networks if n.get("networkCode") == network),
        None
    )
    if not target_network or not target_network.get("isReceivable"):
        raise ValueError(f"Network {network} for {currency} is not currently receivable")

    # 2. Call deposit address endpoint
    payload = {
        "uniqueUserIdentifier": user_id,
        "currency": currency,
        "network": network,
    }
    return client.post("/v1/addresses/broker", json_data=payload)
```

### Go
```go
package collections

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type CreateAddressRequest struct {
	UniqueUserIdentifier string  `json:"uniqueUserIdentifier"`
	Currency             string  `json:"currency"`
	Network              string  `json:"network"`
}

type DepositAddressResponse struct {
	Address              string  `json:"address"`
	Currency             string  `json:"currency"`
	Network              string  `json:"network"`
	Memo                 *string `json:"memo"`
	UniqueUserIdentifier string  `json:"uniqueUserIdentifier"`
}

func CreateDepositAddress(client *http.Client, baseURL, userId, currency, network string) (*DepositAddressResponse, error) {
	reqBody := CreateAddressRequest{
		UniqueUserIdentifier: userId,
		Currency:             currency,
		Network:              network,
	}

	payload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, baseURL+"/v1/addresses/broker", bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}

	var result DepositAddressResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}
```
