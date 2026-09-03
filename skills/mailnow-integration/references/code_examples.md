# MailNow Multi-Language Code Examples

Complete implementation snippets for sending emails, bulk dispatch, status checking, and template retrieval across cURL, JavaScript/TypeScript, Python, Go, and Rust.

---

## 1. Send Single Email (`POST /v1/email/send`)

### cURL
```bash
curl -X POST https://api.mailnow.xyz/v1/email/send \
  -H "X-API-Key: mn_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "notifications@yourdomain.com",
    "to": "user@example.com",
    "subject": "Welcome to Our Platform",
    "html": "<h1>Welcome!</h1><p>Thanks for joining us.</p>",
    "text": "Welcome! Thanks for joining us."
  }'
```

### JavaScript / TypeScript (Fetch API / Node.js 18+)
```typescript
interface SendEmailResponse {
  success: boolean;
  message: string;
  data: {
    message_id: string;
    status: string;
  };
}

async function sendEmail() {
  const response = await fetch("https://api.mailnow.xyz/v1/email/send", {
    method: "POST",
    headers: {
      "X-API-Key": process.env.MAILNOW_API_KEY || "mn_live_your_api_key_here",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "notifications@yourdomain.com",
      to: "user@example.com",
      subject: "Welcome to Our Platform",
      html: "<h1>Welcome!</h1><p>Thanks for joining us.</p>",
      text: "Welcome! Thanks for joining us.",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`MailNow request failed (${response.status}): ${errorBody}`);
  }

  const result: SendEmailResponse = await response.json();
  console.log("Message ID:", result.data.message_id);
  return result;
}
```

### Python (`requests`)
```python
import os
import requests

url = "https://api.mailnow.xyz/v1/email/send"
headers = {
    "X-API-Key": os.getenv("MAILNOW_API_KEY", "mn_live_your_api_key_here"),
    "Content-Type": "application/json",
}
payload = {
    "from": "notifications@yourdomain.com",
    "to": "user@example.com",
    "subject": "Welcome to Our Platform",
    "html": "<h1>Welcome!</h1><p>Thanks for joining us.</p>",
    "text": "Welcome! Thanks for joining us."
}

response = requests.post(url, headers=headers, json=payload)
response.raise_for_status()
data = response.json()
print("Message ID:", data["data"]["message_id"])
```

### Go (`net/http`)
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

func main() {
    apiKey := os.Getenv("MAILNOW_API_KEY")
    if apiKey == "" {
        apiKey = "mn_live_your_api_key_here"
    }

    payload, _ := json.Marshal(map[string]interface{}{
        "from":    "notifications@yourdomain.com",
        "to":      "user@example.com",
        "subject": "Welcome to Our Platform",
        "html":    "<h1>Welcome!</h1><p>Thanks for joining us.</p>",
        "text":    "Welcome! Thanks for joining us.",
    })

    req, err := http.NewRequest("POST", "https://api.mailnow.xyz/v1/email/send", bytes.NewBuffer(payload))
    if err != nil {
        panic(err)
    }

    req.Header.Set("X-API-Key", apiKey)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("Response (%d): %s\n", resp.StatusCode, string(body))
}
```

### Rust (`reqwest` + `tokio`)
```rust
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let api_key = std::env::var("MAILNOW_API_KEY")
        .unwrap_or_else(|_| "mn_live_your_api_key_here".to_string());

    let client = Client::new();
    let res = client
        .post("https://api.mailnow.xyz/v1/email/send")
        .header("X-API-Key", api_key)
        .header("Content-Type", "application/json")
        .json(&json!({
            "from": "notifications@yourdomain.com",
            "to": "user@example.com",
            "subject": "Welcome to Our Platform",
            "html": "<h1>Welcome!</h1><p>Thanks for joining us.</p>",
            "text": "Welcome! Thanks for joining us."
        }))
        .send()
        .await?;

    let status = res.status();
    let body = res.text().await?;
    println!("Response ({status}): {body}");
    Ok(())
}
```

---

## 2. Bulk Send Email (`POST /v1/email/send/bulk`)

### JavaScript / TypeScript
```typescript
async function sendBulkEmail(recipients: string[]) {
  const response = await fetch("https://api.mailnow.xyz/v1/email/send/bulk", {
    method: "POST",
    headers: {
      "X-API-Key": process.env.MAILNOW_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "updates@yourdomain.com",
      to: recipients,
      subject: "Important Platform Notice",
      html: "<h1>Notice</h1><p>System maintenance scheduled for tonight.</p>",
      text: "System maintenance scheduled for tonight.",
    }),
  });

  const data = await response.json();
  console.log("Queued count:", data.data.results.length);
  return data;
}
```

---

## 3. Check Delivery Status (`GET /v1/email/status/{message_id}`)

### Python
```python
import requests

message_id = "msg_df7e20ec42a8b9e1"
url = f"https://api.mailnow.xyz/v1/email/status/{message_id}"
headers = {"X-API-Key": "mn_live_your_api_key_here"}

response = requests.get(url, headers=headers)
data = response.json()
print("Delivery Status:", data["data"]["status"])
```

---

## 4. Fetch Templates (`GET /v1/templates`)

### JavaScript / TypeScript
```typescript
async function listTemplates() {
  const response = await fetch("https://api.mailnow.xyz/v1/templates", {
    headers: {
      "X-API-Key": process.env.MAILNOW_API_KEY!,
    },
  });

  const { data } = await response.json();
  console.log("Configured Templates:", data);
  return data;
}
```

