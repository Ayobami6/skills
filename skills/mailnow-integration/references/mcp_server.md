# MailNow FastMCP Server Guide

The MailNow Model Context Protocol (MCP) Server allows AI coding assistants (Claude Desktop, Cursor, Antigravity, Windsurf) and autonomous agents to execute email operations directly via standard MCP tool calling.

---

## 1. Available MCP Tools

### `send_email`
Sends an email via the MailNow platform. Deducts 1 API credit.

**Parameters**:
- `to` *(string, required)*: Recipient email address.
- `subject` *(string, required)*: Email subject line.
- `content` *(string, required)*: Plain text or HTML content body.
- `is_html` *(boolean, optional)*: Set to `true` if content contains HTML markup (default: `false`).
- `template_id` *(integer, optional)*: Optional ID of a saved template.
- `from_name` *(string, optional)*: Custom sender display name.

---

### `check_status`
Retrieves the real-time delivery state of a previously queued email.

**Parameters**:
- `message_id` *(string, required)*: The unique message ID returned from `send_email` (e.g. `msg_df7e20ec42a8b9e1`).

---

### `list_templates`
Lists all available email templates created for the authenticated company/account.

**Parameters**: None.

---

## 2. Running the Server

### STDIO Mode (Local Process)
Default mode for desktop AI clients like Claude Desktop:

```bash
# Direct python execution
python server.py

# Or using uv
uv run server.py
```

### SSE Mode (Remote HTTP / Server-Sent Events)
For cloud agents, remote IDEs, or team-shared MCP servers:

```bash
MCP_TRANSPORT=sse MCP_PORT=8080 python server.py
```

---

## 3. AI Client Configurations

### Claude Desktop Configuration
Add to `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mailnow": {
      "command": "python",
      "args": ["/path/to/mailnow/mcp-server/server.py"],
      "env": {
        "MAILNOW_API_KEY": "mn_live_your_api_key_here",
        "MAILNOW_API_URL": "https://api.mailnow.xyz"
      }
    }
  }
}
```

### Cursor / Remote SSE Configuration
Add to `.cursor/mcp.json` or Cursor Settings $\rightarrow$ Features $\rightarrow$ MCP:

```json
{
  "mcpServers": {
    "mailnow-sse": {
      "url": "https://mcp.mailnow.xyz/sse",
      "headers": {
        "X-API-Key": "mn_live_your_api_key_here"
      }
    }
  }
}
```

---

## 4. Programmatic FastMCP Client in Python

You can invoke MailNow MCP tools programmatically in Python using `fastmcp`:

```python
import asyncio
import os
from fastmcp import Client
from fastmcp.client.transports import SSETransport

async def main():
    api_key = os.getenv("MAILNOW_API_KEY", "mn_live_your_api_key_here")
    
    transport = SSETransport(
        "https://mcp.mailnow.xyz/sse",
        headers={"X-API-Key": api_key}
    )
    
    async with Client(transport) as client:
        # 1. Fetch available templates
        templates = await client.call_tool("list_templates", {})
        print("Templates:", templates)

        # 2. Send email via MCP tool
        result = await client.call_tool("send_email", {
            "to": "user@example.com",
            "subject": "Hello via MCP",
            "content": "This email was dispatched via MailNow MCP Server!",
            "is_html": False
        })
        print("Send Email Result:", result)

if __name__ == "__main__":
    asyncio.run(main())
```

