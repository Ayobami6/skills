# Python SDK Guide (`py-mailnow`)

The official Python client library for MailNow provides strict type annotations, comprehensive error handling, and support for Python 3.12+.

- **Package Name**: `py-mailnow`
- **Repository**: [github.com/Ayobami6/py-mailnow](https://github.com/Ayobami6/py-mailnow)

---

## 1. Installation

Install via `pip`:
```bash
pip install py-mailnow
```

Or using `uv`:
```bash
uv add py-mailnow
```

---

## 2. Quickstart

```python
import os
from mailnow import MailnowClient

# Initialize client using your API key
api_key = os.getenv("MAILNOW_API_KEY", "mn_live_your_api_key_here")
client = MailnowClient(api_key=api_key)

# Send an HTML & plain text transactional email
response = client.send_email(
    from_email="notifications@yourdomain.com",
    to_email="recipient@example.com",
    subject="Welcome to Our Platform!",
    html="<h1>Welcome!</h1><p>Thank you for signing up for our service.</p>",
    text="Welcome! Thank you for signing up for our service."
)

print(f"Email sent! Message ID: {response['message_id']}")
```

---

## 3. Method Signatures & Parameters

### `send_email`
```python
client.send_email(
    from_email: str,
    to_email: str,
    subject: str,
    html: str | None = None,
    text: str | None = None,
    template_id: int | None = None,
    attachments: list[dict] | None = None
) -> dict
```

#### Parameters:
- `from_email` *(str, required)*: Sender email address.
- `to_email` *(str, required)*: Recipient email address.
- `subject` *(str, required)*: Email subject line.
- `html` *(str, optional)*: HTML-formatted email body.
- `text` *(str, optional)*: Plain-text fallback.
- `template_id` *(int, optional)*: ID of a saved template to render.
- `attachments` *(list[dict], optional)*: List of attachments formatted as `{"filename": str, "content": base64_str, "content_type": str}`.

---

## 4. Exception Handling

`py-mailnow` provides specialized exception classes mapped to HTTP response codes:

```python
from mailnow import (
    MailnowClient,
    MailnowError,
    MailnowValidationError,
    MailnowAuthError,
    MailnowRateLimitError,
    MailnowServerError,
    MailnowConnectionError
)

client = MailnowClient(api_key="mn_live_your_api_key_here")

try:
    response = client.send_email(
        from_email="sender@yourdomain.com",
        to_email="recipient@example.com",
        subject="Important Notice",
        html="<p>Account update details.</p>"
    )
    print(f"✓ Email sent successfully: {response['message_id']}")

except MailnowValidationError as e:
    # 400 Bad Request: Missing or invalid parameters
    print(f"✗ Validation error: {e}")

except MailnowAuthError as e:
    # 401/403 Unauthorized: Invalid or missing API key
    print(f"✗ Authentication error: {e}")

except MailnowRateLimitError as e:
    # 429 Rate Limit: Quota or API credits depleted
    print(f"✗ Rate limit exceeded / Insufficient credits: {e}")

except MailnowServerError as e:
    # 500+ Internal Server Error
    print(f"✗ MailNow server error: {e}")

except MailnowConnectionError as e:
    # Network / DNS / Timeout issue
    print(f"✗ Network connection error: {e}")

except MailnowError as e:
    # Base exception for all other MailNow SDK errors
    print(f"✗ Unexpected error: {e}")
```

