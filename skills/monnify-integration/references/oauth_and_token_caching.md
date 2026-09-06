# Monnify OAuth 2.0 Authentication & Token Caching

Monnify uses an OAuth 2.0 Bearer token architecture for securing all API requests. You obtain a temporary access token by passing your Basic authentication credentials (`apiKey:secretKey`) to the login endpoint, and reuse that token across subsequent requests.

---

## 1. Environments & Endpoints

| Environment | Base URL | Login Endpoint |
| :--- | :--- | :--- |
| **Sandbox (Test)** | `https://sandbox.monnify.com` | `POST https://sandbox.monnify.com/api/v1/auth/login` |
| **Production (Live)** | `https://api.monnify.com` | `POST https://api.monnify.com/api/v1/auth/login` |

---

## 2. Authentication Protocol

### Request Specifications
* **Method**: `POST`
* **Path**: `/api/v1/auth/login`
* **Headers**:
  * `Authorization`: `Basic <base64(apiKey:secretKey)>`
  * `Content-Type`: `application/json`

### Example Request
```http
POST /api/v1/auth/login HTTP/1.1
Host: sandbox.monnify.com
Authorization: Basic TUtfVEVTVF9YWFg6WVlZWVk=
Content-Type: application/json
```

### Example Response
```json
{
  "requestSuccessful": true,
  "responseMessage": "success",
  "responseCode": "0",
  "responseBody": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

* `accessToken`: JWT Bearer token valid for all subsequent API endpoints.
* `expiresIn`: Token validity duration in seconds (typically `3600` seconds / 1 hour).

---

## 3. Token Caching Best Practice

> [!IMPORTANT]
> **Do not authenticate on every request.**
> Initiating an authentication request for every transaction creates excessive latency, hits rate limits, and degrades throughput. Tokens must be cached in-memory or in a shared cache (like Redis) and refreshed **60 seconds before expiration**.

---

## 4. Production Implementations

### Node.js / TypeScript Token Manager
```typescript
import axios, { AxiosInstance } from 'axios';

interface MonnifyAuthResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: {
    accessToken: string;
    expiresIn: number;
  };
}

export class MonnifyTokenManager {
  private cachedToken: string | null = null;
  private expiresAt: number = 0;

  constructor(
    private readonly apiKey: string,
    private readonly secretKey: string,
    private readonly baseUrl: string = 'https://sandbox.monnify.com'
  ) {}

  public async getAccessToken(): Promise<string> {
    const now = Date.now();
    // Re-use cached token if more than 60 seconds remain
    if (this.cachedToken && this.expiresAt - now > 60_000) {
      return this.cachedToken;
    }

    const credentials = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64');

    const response = await axios.post<MonnifyAuthResponse>(
      `${this.baseUrl}/api/v1/auth/login`,
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.requestSuccessful) {
      throw new Error(`Monnify Auth Failed: ${response.data.responseMessage}`);
    }

    const { accessToken, expiresIn } = response.data.responseBody;
    this.cachedToken = accessToken;
    // Set expiry epoch with a 60-second safety cushion
    this.expiresAt = now + (expiresIn - 60) * 1000;

    return this.cachedToken;
  }

  public createAxiosClient(): AxiosInstance {
    const client = axios.create({ baseURL: this.baseUrl });

    client.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    return client;
  }
}
```

---

### Python Token Manager (with Cache & Retries)
```python
import base64
import time
import requests
from typing import Optional

class MonnifyAuthClient:
    def __init__(self, api_key: str, secret_key: str, is_production: bool = False):
        self.api_key = api_key
        self.secret_key = secret_key
        self.base_url = "https://api.monnify.com" if is_production else "https://sandbox.monnify.com"
        self._cached_token: Optional[str] = None
        self._expires_at: float = 0

    def get_access_token(self) -> str:
        now = time.time()
        # Return cached token if more than 60 seconds left before expiration
        if self._cached_token and (self._expires_at - now > 60):
            return self._cached_token

        encoded_auth = base64.b64encode(f"{self.api_key}:{self.secret_key}".encode("utf-8")).decode("utf-8")
        headers = {
            "Authorization": f"Basic {encoded_auth}",
            "Content-Type": "application/json"
        }

        response = requests.post(f"{self.base_url}/api/v1/auth/login", headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data.get("requestSuccessful"):
            raise RuntimeError(f"Monnify Authentication error: {data.get('responseMessage')}")

        body = data["responseBody"]
        self._cached_token = body["accessToken"]
        self._expires_at = now + body["expiresIn"] - 60  # safety margin

        return self._cached_token

    def get_auth_headers(self) -> dict:
        token = self.get_access_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
```

