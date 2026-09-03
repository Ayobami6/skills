# Bitnob Multi-Language Code Examples

This guide provides end-to-end integration snippets across TypeScript/Node.js, Python, and Go for the most common Bitnob workflows.

---

## 1. TypeScript / Node.js Complete Client

```typescript
// bitnobClient.ts
export class BitnobClient {
  private apiKey: string;
  private baseUrl: string = "https://api.bitnob.co/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok || !data.status) {
      throw new Error(data.message || `Bitnob API Error: ${res.status}`);
    }
    return data.data;
  }

  // 1. Create Lightning Invoice
  async createLightningInvoice(customerEmail: string, satoshis: number, description: string) {
    return this.request<{ payment_request: string; r_hash: string; id: string }>(
      "/wallets/ln/createinvoice",
      {
        method: "POST",
        body: JSON.stringify({ customerEmail, satoshis, description, expiresIn: 3600 }),
      }
    );
  }

  // 2. Pay Lightning Invoice
  async payLightningInvoice(paymentRequest: string, reference: string, customerEmail: string) {
    return this.request<{ status: string; id: string }>(
      "/wallets/ln/pay",
      {
        method: "POST",
        body: JSON.stringify({ request: paymentRequest, reference, customerEmail }),
      }
    );
  }

  // 3. Generate On-Chain Address
  async generateBtcAddress(customerEmail: string, label: string) {
    return this.request<{ address: string }>(
      "/addresses/generate",
      {
        method: "POST",
        body: JSON.stringify({ customerEmail, label }),
      }
    );
  }

  // 4. Issue Virtual USD Card
  async issueVirtualCard(customerId: string, amountCents: number) {
    return this.request<{ id: string; card_number: string; cvv: string }>(
      "/cards/virtual",
      {
        method: "POST",
        body: JSON.stringify({ customerId, currency: "USD", amount: amountCents, brand: "visa" }),
      }
    );
  }

  // 5. Create Hosted Checkout
  async createCheckout(params: {
    amount: number;
    currency: string;
    customerEmail: string;
    customerName: string;
    callbackUrl: string;
    description: string;
  }) {
    return this.request<{ id: string; checkoutUrl: string }>(
      "/checkout",
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  }
}
```

---

## 2. Python Client

```python
# bitnob_client.py
import requests
from typing import Dict, Any, Optional

class BitnobClient:
    BASE_URL = "https://api.bitnob.co/api/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        })

    def _post(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.BASE_URL}{endpoint}"
        response = self.session.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        if not data.get("status"):
            raise ValueError(data.get("message", "API request failed"))
        return data.get("data", {})

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.BASE_URL}{endpoint}"
        response = self.session.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        if not data.get("status"):
            raise ValueError(data.get("message", "API request failed"))
        return data.get("data", {})

    def create_lightning_invoice(self, customer_email: str, satoshis: int, description: str) -> Dict[str, Any]:
        return self._post("/wallets/ln/createinvoice", {
            "customerEmail": customer_email,
            "satoshis": satoshis,
            "description": description,
            "expiresIn": 3600
        })

    def pay_lightning_invoice(self, payment_request: str, reference: str, customer_email: str) -> Dict[str, Any]:
        return self._post("/wallets/ln/pay", {
            "request": payment_request,
            "reference": reference,
            "customerEmail": customer_email
        })

    def issue_virtual_card(self, customer_id: str, amount_cents: int) -> Dict[str, Any]:
        return self._post("/cards/virtual", {
            "customerId": customer_id,
            "currency": "USD",
            "amount": amount_cents,
            "brand": "visa"
        })
```

---

## 3. Go Client

```go
// bitnob.go
package bitnob

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	APIKey     string
	BaseURL    string
	HTTPClient *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		APIKey:  apiKey,
		BaseURL: "https://api.bitnob.co/api/v1",
		HTTPClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

type APIResponse struct {
	Status  bool            `json:"status"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

func (c *Client) Post(endpoint string, body interface{}, out interface{}) error {
	payload, err := json.Marshal(body)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", c.BaseURL+endpoint, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var apiResp APIResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return err
	}

	if !apiResp.Status {
		return fmt.Errorf("bitnob error: %s", apiResp.Message)
	}

	if out != nil {
		return json.Unmarshal(apiResp.Data, out)
	}
	return nil
}
```

