# MailNow REST API Reference

The MailNow REST API allows developers to send emails, manage batches, track delivery statuses, and fetch email templates.

- **Base URL**: `https://api.mailnow.xyz`
- **Protocol**: HTTPS
- **Data Format**: `application/json`

---

## Authentication & Headers

All requests to `/v1/*` endpoints must include an API Key passed in the `X-API-Key` request header.

```http
X-API-Key: mn_live_your_api_key_here
Content-Type: application/json
```

### Key Prefixes
- `mn_live_...`: Live production key for sending real emails.
- `mn_test_...`: Sandbox/test key for staging and validation.

---

## API Endpoints

### 1. Send Single Email
**`POST /v1/email/send`**

Dispatches a single transactional email via background workers. Deducts 1 API credit upon queueing.

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `from` | `string` | **Yes** | Sender email address (e.g. `notifications@yourdomain.com`). |
| `to` | `string` | **Yes** | Recipient email address. |
| `subject` | `string` | **Yes** | Subject line of the email. |
| `html` | `string` | Optional* | HTML body string. (*Required if no `text` or `template_id` provided). |
| `text` | `string` | Optional* | Plain text fallback. (*Required if no `html` or `template_id` provided). |
| `template_id` | `integer` | Optional* | ID of saved email template to render. |
| `attachments` | `array` | Optional | Array of attachment objects (see below). |

#### Attachment Object Schema
| Property | Type | Description |
| :--- | :--- | :--- |
| `filename` | `string` | The file name with extension (e.g. `invoice.pdf`). |
| `content` | `string` | Base64-encoded string of the file contents. |
| `content_type` | `string` | MIME type (e.g. `application/pdf`, `image/png`). |

#### Example Request
```json
{
  "from": "notifications@yourdomain.com",
  "to": "user@example.com",
  "subject": "Welcome to Our Platform",
  "html": "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
  "text": "Welcome! Thanks for signing up."
}
```

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "message": "Email queued successfully",
  "data": {
    "message_id": "msg_df7e20ec42a8b9e1",
    "status": "queued"
  }
}
```

---

### 2. Bulk Send Email
**`POST /v1/email/send/bulk`**

Queues and sends an email to multiple recipients simultaneously. Deducts 1 API credit per recipient.

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `from` | `string` | **Yes** | Sender email address. |
| `to` | `array of strings` | **Yes** | List of recipient email addresses. |
| `subject` | `string` | **Yes** | Subject line of the email. |
| `html` | `string` | Optional* | HTML body string. |
| `text` | `string` | Optional* | Plain text content. |
| `template_id` | `integer` | Optional* | ID of saved company email template. |
| `attachments` | `array` | Optional | Array of attachment objects. |

#### Example Request
```json
{
  "from": "newsletter@yourdomain.com",
  "to": ["alice@example.com", "bob@example.com"],
  "subject": "Monthly Product Updates",
  "html": "<h1>What's New</h1><p>Check out our latest releases.</p>",
  "text": "What's New: Check out our latest releases."
}
```

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "message": "Bulk emails queued successfully",
  "data": {
    "results": [
      {
        "to": "alice@example.com",
        "message_id": "msg_df7e20ec42a8b9e1"
      },
      {
        "to": "bob@example.com",
        "message_id": "msg_90e72288ab10bc4f"
      }
    ],
    "status": "queued"
  }
}
```

---

### 3. Check Email Status
**`GET /v1/email/status/{message_id}`**

Retrieves the delivery record and current state for a given message ID.

#### URL Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `message_id` | `string` | The unique message ID returned by `/v1/email/send`. |

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "message_id": "msg_df7e20ec42a8b9e1",
    "status": "success",
    "from": "notifications@yourdomain.com",
    "to": "user@example.com",
    "subject": "Welcome to Our Platform",
    "created_at": "2026-09-03T08:30:00Z",
    "delivered_at": "2026-09-03T08:30:04Z"
  }
}
```

#### Possible Status Values
- `queued`: The message is in the delivery queue.
- `success`: The message was successfully accepted by the recipient's mail exchange.
- `failed`: Delivery failed (e.g. bounce, invalid address, SMTP rejection).

---

### 4. Fetch Email Templates
**`GET /v1/templates`**

Retrieves all saved email templates configured for the account.

#### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "name": "Welcome Onboarding",
      "subject": "Welcome to {{company_name}}",
      "created_at": "2026-01-15T12:00:00Z"
    }
  ]
}
```

---

## Status & Error Codes

| HTTP Status | Name | Reason & Troubleshooting |
| :--- | :--- | :--- |
| **`200 OK`** | Success | Request succeeded and email / action was queued. |
| **`400 Bad Request`** | Validation Error | Missing required fields (`from`, `to`, `subject`), invalid email format, or no body/template provided. |
| **`401 / 403`** | Unauthorized / Forbidden | Missing, invalid, or disabled `X-API-Key` header. Check your key prefix and account status. |
| **`429 Rate Limit`** | Quota Depleted | Company API credits are exhausted. Reset occurs monthly on your billing cycle. |
| **`500 Internal Server Error`** | Server Error | An internal delivery error occurred. Retry with exponential backoff. |

