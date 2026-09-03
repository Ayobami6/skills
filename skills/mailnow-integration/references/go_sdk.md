# Go SDK Guide (`go-mailnow`)

The official Go SDK provides a lightweight, idiomatic, zero-external-dependency client for MailNow with standard library context timeouts and typed errors.

- **Package**: `github.com/Ayobami6/go-mailnow`
- **Repository**: [github.com/Ayobami6/go-mailnow](https://github.com/Ayobami6/go-mailnow)

---

## 1. Installation

```bash
go get github.com/Ayobami6/go-mailnow
```

---

## 2. Quickstart

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    "time"

    "github.com/Ayobami6/go-mailnow"
)

func main() {
    apiKey := os.Getenv("MAILNOW_API_KEY")
    if apiKey == "" {
        apiKey = "mn_live_your_api_key_here"
    }

    // Initialize client
    client, err := mailnow.NewClient(apiKey)
    if err != nil {
        log.Fatalf("Failed to initialize MailNow client: %v", err)
    }

    // Send with context timeout
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    req := &mailnow.EmailRequest{
        From:    "notifications@yourdomain.com",
        To:      "recipient@example.com",
        Subject: "Hello from go-mailnow!",
        HTML:    "<h1>Welcome</h1><p>This is a test email sent via go-mailnow SDK.</p>",
        Text:    "Welcome! This is a test email sent via go-mailnow SDK.",
    }

    resp, err := client.SendEmail(ctx, req)
    if err != nil {
        log.Fatalf("Failed to send email: %v", err)
    }

    fmt.Printf("Email sent successfully! Message ID: %s, Status: %s\n", resp.MessageID, resp.Status)
}
```

---

## 3. Data Structures

### `EmailRequest`
```go
type EmailRequest struct {
    From        string       `json:"from"`
    To          string       `json:"to"`
    Subject     string       `json:"subject"`
    HTML        string       `json:"html,omitempty"`
    Text        string       `json:"text,omitempty"`
    TemplateID  int          `json:"template_id,omitempty"`
    Attachments []Attachment `json:"attachments,omitempty"`
}
```

### `Attachment`
```go
type Attachment struct {
    Filename    string `json:"filename"`
    Content     string `json:"content"`      // Base64-encoded string
    ContentType string `json:"content_type"` // MIME type
}
```

### `EmailResponse`
```go
type EmailResponse struct {
    Success   bool   `json:"success"`
    Message   string `json:"message"`
    MessageID string `json:"message_id"`
    Status    string `json:"status"`
}
```

---

## 4. Error Handling & Type Assertions

`go-mailnow` returns structured error types that can be inspected via Go type switches:

```go
package main

import (
    "context"
    "log"
    "time"

    "github.com/Ayobami6/go-mailnow"
)

func sendWithHandling(client *mailnow.Client, req *mailnow.EmailRequest) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    resp, err := client.SendEmail(ctx, req)
    if err != nil {
        switch e := err.(type) {
        case *mailnow.ValidationError:
            log.Printf("400 Validation error: %v", e)
        case *mailnow.AuthError:
            log.Printf("401/403 Authentication error: %v", e)
        case *mailnow.RateLimitError:
            log.Printf("429 Insufficient credits / rate limit: %v", e)
        case *mailnow.ServerError:
            log.Printf("500 MailNow server error: %v", e)
        case *mailnow.ConnectionError:
            log.Printf("Network connection error: %v", e)
        default:
            log.Printf("Unexpected error: %v", err)
        }
        return
    }

    log.Printf("✓ Email sent successfully! ID: %s", resp.MessageID)
}
```

