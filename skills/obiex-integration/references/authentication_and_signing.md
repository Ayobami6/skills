# Obiex Authentication & Request Signing Guide

This guide covers the cryptographic request signing scheme required by the Obiex API (`https://api.obiex.finance/v1/`). Every authenticated call requires an HMAC-SHA256 signature to verify identity and mitigate replay attacks.

---

## 1. Authentication Scheme Overview

All authenticated endpoints require three standard HTTP headers:

| Header | Format | Description |
| :--- | :--- | :--- |
| **`x-api-key`** | String | Your public API key from the Obiex Dashboard (**Settings > Developers > API Keys**) |
| **`x-api-timestamp`** | Number / String | Current Unix epoch time in **milliseconds** (e.g., `Date.now()` or `1761480000000`) |
| **`x-api-signature`** | Hex String | Lowercase hex-encoded HMAC-SHA256 signature |

---

## 2. Signature Algorithm Specification

### Message Construction Rule
The message to sign is formed by concatenating three values without delimiters:
$$\text{Message} = \{\text{HTTP\_METHOD}\}\{\text{PATH}\}\{\text{TIMESTAMP}\}$$

- **`HTTP_METHOD`**: Uppercase verb (`GET`, `POST`, `PUT`, `DELETE`).
- **`PATH`**: The URL path **including** the `/v1` version prefix (e.g. `/v1/addresses/me/broker` or `/v1/wallets/USDT`). Do **not** include the hostname or protocol.
- **`TIMESTAMP`**: The identical millisecond timestamp passed in `x-api-timestamp`.

### Example
For a `GET` request to `https://api.obiex.finance/v1/addresses/me/broker` at timestamp `1761480000000`:
- **Message**: `GET/v1/addresses/me/broker1761480000000`
- **Secret Key**: `your_api_secret_key`
- **Algorithm**: `HMAC-SHA256(Message, SecretKey)`
- **Output**: Hexadecimal string (64 characters, lowercase)

> [!IMPORTANT]
> The path MUST include `/v1`. If your HTTP client strips `/v1` or only signs `/addresses/me/broker`, Obiex will reject the request with HTTP `401 Unauthorized`.

---

## 3. Multi-Language Implementations

### Node.js / TypeScript (Official SDK)
The official `obiex-api` package natively computes signatures and manages timestamps.

```typescript
import { ObiexClient } from 'obiex-api';

const client = new ObiexClient({
  apiKey: process.env.OBIEX_API_KEY!,
  apiSecret: process.env.OBIEX_API_SECRET!,
  sandboxMode: process.env.NODE_ENV !== 'production', // true routes to staging
});

// Requests automatically sign and attach headers
const currencies = await client.getTradableCurrencies();
console.log(currencies);
```

### Node.js / TypeScript (Raw HTTP / Axios Interceptor)
If you prefer not to use the SDK or are writing a custom adapter:

```typescript
import crypto from 'node:crypto';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export function createObiexHttpClient(
  apiKey: string,
  apiSecret: string,
  baseURL: string = 'https://api.obiex.finance/v1'
): AxiosInstance {
  const instance = axios.create({ baseURL });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const timestamp = Date.now().toString();
    const method = (config.method || 'GET').toUpperCase();

    // Ensure path begins with /v1
    const rawPath = config.url || '';
    const pathWithV1 = rawPath.startsWith('/v1')
      ? rawPath
      : `/v1${rawPath.startsWith('/') ? rawPath : `/${rawPath}`}`;

    const message = `${method}${pathWithV1}${timestamp}`;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(message)
      .digest('hex');

    config.headers.set('x-api-key', apiKey);
    config.headers.set('x-api-timestamp', timestamp);
    config.headers.set('x-api-signature', signature);
    config.headers.set('Content-Type', 'application/json');

    return config;
  });

  return instance;
}
```

### Python (Requests / HTTPX)
Idiomatic Python implementation using standard `hmac` and `hashlib`:

```python
import time
import hmac
import hashlib
from typing import Dict, Any, Optional
import httpx

class ObiexClient:
    def __init__(
        self,
        api_key: str,
        api_secret: str,
        sandbox_mode: bool = False,
    ) -> None:
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = (
            "https://staging.api.obiex.finance/v1"
            if sandbox_mode
            else "https://api.obiex.finance/v1"
        )
        self.client = httpx.Client(base_url=self.base_url, timeout=15.0)

    def _generate_headers(self, method: str, path: str) -> Dict[str, str]:
        timestamp = str(int(time.time() * 1000))
        # Ensure path begins with /v1
        normalized_path = path if path.startswith("/v1") else f"/v1{path}"
        message = f"{method.upper()}{normalized_path}{timestamp}"
        
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        return {
            "x-api-key": self.api_key,
            "x-api-timestamp": timestamp,
            "x-api-signature": signature,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        headers = self._generate_headers("GET", path)
        response = self.client.get(path, headers=headers, params=params)
        response.raise_for_status()
        return response.json()

    def post(self, path: str, json_data: Optional[Dict[str, Any]] = None) -> Any:
        headers = self._generate_headers("POST", path)
        response = self.client.post(path, headers=headers, json=json_data)
        response.raise_for_status()
        return response.json()
```

### Go (Standard Library `crypto/hmac`)
Idiomatic Go implementation implementing standard `http.RoundTripper`:

```go
package obiex

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type AuthTransport struct {
	APIKey    string
	APISecret string
	Base      http.RoundTripper
}

func (t *AuthTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	timestamp := fmt.Sprintf("%d", time.Now().UnixMilli())
	method := req.Method
	
	path := req.URL.Path
	if !strings.HasPrefix(path, "/v1") {
		path = "/v1" + path
	}

	message := fmt.Sprintf("%s%s%s", method, path, timestamp)

	mac := hmac.New(sha256.New, []byte(t.APISecret))
	mac.Write([]byte(message))
	signature := hex.EncodeToString(mac.Sum(nil))

	req.Header.Set("x-api-key", t.APIKey)
	req.Header.Set("x-api-timestamp", timestamp)
	req.Header.Set("x-api-signature", signature)
	req.Header.Set("Content-Type", "application/json")

	base := t.Base
	if base == nil {
		base = http.DefaultTransport
	}
	return base.RoundTrip(req)
}

func NewClient(apiKey, apiSecret, baseURL string) *http.Client {
	return &http.Client{
		Timeout: 15 * time.Second,
		Transport: &AuthTransport{
			APIKey:    apiKey,
			APISecret: apiSecret,
		},
	}
}
```

### Rust (`reqwest` & `hmac`)
```rust
use hmac::{Hmac, Mac};
use sha2::Sha256;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE};
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

pub fn generate_obiex_headers(
    api_key: &str,
    api_secret: &str,
    method: &str,
    path: &str,
) -> Result<HeaderMap, Box<dyn std::error::Error>> {
    let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis();
    let timestamp = now.to_string();

    let normalized_path = if path.starts_with("/v1") {
        path.to_string()
    } else {
        format!("/v1{}", path)
    };

    let message = format!("{}{}{}", method.to_uppercase(), normalized_path, timestamp);

    let mut mac = HmacSha256::new_from_slice(api_secret.as_bytes())?;
    mac.update(message.as_bytes());
    let signature = hex::encode(mac.finalize().into_bytes());

    let mut headers = HeaderMap::new();
    headers.insert("x-api-key", HeaderValue::from_str(api_key)?);
    headers.insert("x-api-timestamp", HeaderValue::from_str(&timestamp)?);
    headers.insert("x-api-signature", HeaderValue::from_str(&signature)?);
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    Ok(headers)
}
```

---

## 4. Security & Replay Mitigation Rules

1. **Replay Window Tolerance**:
   - Obiex verifies that the `x-api-timestamp` is within reasonable clock tolerance (typically within 5 minutes) of current server time.
   - Synchronize system clocks with NTP (`ntpdate` or AWS Time Sync Service).
2. **Secret Storage**:
   - Store `OBIEX_API_SECRET` strictly in server-side secret managers (AWS Secrets Manager, GCP Secret Manager, Vault, or `.env`).
   - Never commit API secrets or include them in mobile/frontend code.
3. **Rotating Keys**:
   - If an API key is ever compromised, revoke it immediately in the Obiex Dashboard under **Settings > Developers > API Keys** and generate a new keypair.
