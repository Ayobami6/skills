# Buffer Authentication, CLI & MCP Setup Guide

This guide covers authenticating with Buffer via personal API keys, configuring the official Buffer CLI (`@bufferapp/cli`), and connecting AI agents via the hosted Buffer Model Context Protocol (MCP) server.

---

## 1. Authentication Mechanisms

Buffer supports two primary authentication schemes:
1. **Personal API Keys (Recommended for direct integration & scripts)**: Static bearer tokens generated per user/organization.
2. **OAuth 2.0 with PKCE**: For third-party apps and multi-tenant integrations where external users authorize access to their Buffer accounts.

### Obtaining a Personal API Key
1. Sign in to your Buffer dashboard.
2. Navigate to **[Settings > API](https://publish.buffer.com/settings/api)**.
3. Click **Create API Key**, give it a descriptive label, and copy the generated token.
4. Store the token in your application's environment configuration:
   ```bash
   BUFFER_API_KEY=buf_1234567890abcdef...
   ```

### Header Specification
Attach the token to every GraphQL request:
```http
Authorization: Bearer buf_1234567890abcdef...
Content-Type: application/json
Accept: application/json
```

---

## 2. Official Buffer CLI (`@bufferapp/cli`)

Buffer provides an official command-line interface generated from the public GraphQL schema.

### Installation
```bash
npm install -g @bufferapp/cli
```
Verify the installation:
```bash
buffer --version
```

### Initial Configuration
Run the setup wizard to save your API token, default organization, and timezone:
```bash
buffer init
```
This prompts for:
1. Your Buffer API Key.
2. Your default Organization ID.
3. Your primary timezone for scheduling calculations.

### Verification (`buffer doctor`)
Run health checks against your local environment and API connectivity:
```bash
buffer doctor
```
Checks:
- Node.js runtime version
- Token validity & permissions
- Network connectivity to `https://api.buffer.com`

### Common CLI Commands
```bash
# List all connected social channels
buffer channels list

# Inspect channel schedule and queue
buffer queue list --channel <channel_id>

# Create and schedule a post
buffer post create --channel <channel_id> --text "Hello from the CLI!" --mode addToQueue
```

---

## 3. Hosted Buffer Model Context Protocol (MCP) Server

Buffer hosts a cloud-native MCP server (`https://mcp.buffer.com/mcp`) that enables AI coding assistants and LLMs to interact with Buffer using natural language.

### Configuring Buffer MCP in Agent Workspaces

#### Option A: SSE / Stream Endpoint Config
Add the server to your agent's MCP settings (e.g. in `.gemini/antigravity/mcp.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "buffer": {
      "url": "https://mcp.buffer.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_BUFFER_API_KEY"
      }
    }
  }
}
```

#### Option B: Local CLI Bridge
If running via an stdio subprocess command:
```json
{
  "mcpServers": {
    "buffer": {
      "command": "npx",
      "args": ["-y", "@bufferapp/cli", "mcp"],
      "env": {
        "BUFFER_API_KEY": "YOUR_BUFFER_API_KEY"
      }
    }
  }
}
```

### Available MCP Capabilities
Once connected, AI agents gain access to:
- `list_channels`: Discovers connected networks and queue statuses.
- `create_post`: Drafts, schedules, or immediately publishes posts.
- `list_posts`: Inspects upcoming scheduled content and historical sent posts.
- `create_idea`: Stores brainstorm notes directly in Buffer.

---

## 4. Multi-Language Client Setup

### TypeScript / Node.js
```typescript
import axios from 'axios';

export class BufferClient {
  private endpoint = 'https://api.buffer.com';

  constructor(private apiKey: string = process.env.BUFFER_API_KEY || '') {
    if (!this.apiKey) {
      throw new Error('BUFFER_API_KEY is required');
    }
  }

  async execute<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const response = await axios.post(
      this.endpoint,
      { query, variables },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    if (response.data.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data;
  }
}
```

### Python
```python
import os
from typing import Dict, Any, Optional
import httpx

class BufferClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("BUFFER_API_KEY")
        if not self.api_key:
            raise ValueError("BUFFER_API_KEY is required")
        
        self.endpoint = "https://api.buffer.com"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def execute(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                self.endpoint,
                headers=self.headers,
                json={"query": query, "variables": variables or {}},
            )
            resp.raise_for_status()
            data = resp.json()
            if "errors" in data:
                raise ValueError(f"GraphQL Errors: {data['errors']}")
            return data.get("data", {})
```

### Go
```go
package buffer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	APIKey     string
	Endpoint   string
	HTTPClient *http.Client
}

type GraphQLPayload struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables,omitempty"`
}

type GraphQLResponse struct {
	Data   json.RawMessage `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

func NewClient(apiKey string) *Client {
	return &Client{
		APIKey:   apiKey,
		Endpoint: "https://api.buffer.com",
		HTTPClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (c *Client) Execute(query string, variables map[string]interface{}) ([]byte, error) {
	payload, err := json.Marshal(GraphQLPayload{
		Query:     query,
		Variables: variables,
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, c.Endpoint, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result GraphQLResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if len(result.Errors) > 0 {
		return nil, fmt.Errorf("graphql error: %s", result.Errors[0].Message)
	}

	return result.Data, nil
}
```
