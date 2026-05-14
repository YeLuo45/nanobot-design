# API Reference

> REST API, WebSocket multiplexing, Python SDK, and SSE streaming.

## 1. Overview

nanobot provides multiple API interfaces:
- **REST API** — HTTP endpoints for CRUD operations
- **WebSocket** — Real-time bidirectional communication
- **Python SDK** — Python library for programmatic access
- **Gateway** — Unified entry point (:8765)

## 2. REST API

### Base URL

```
http://localhost:8765/api/v1
```

### Authentication

```bash
# API key via header
curl -H "X-Nanobot-API-Key: your-api-key" \
     http://localhost:8765/api/v1/sessions
```

### Sessions

#### List Sessions

```http
GET /sessions
```

**Response:**
```json
{
  "sessions": [
    {
      "session_key": "telegram:123456:789",
      "message_count": 42,
      "last_active": "2024-01-20T14:00:00Z"
    }
  ]
}
```

#### Get Session

```http
GET /sessions/{session_key}
```

#### Delete Session

```http
DELETE /sessions/{session_key}
```

### Messages

#### Send Message

```http
POST /messages
Content-Type: application/json

{
  "content": "Hello, bot!",
  "session_key": "telegram:123456:789"
}
```

**Response:**
```json
{
  "message_id": "msg_123",
  "content": "Hello! How can I help?",
  "session_key": "telegram:123456:789",
  "created_at": "2024-01-20T14:00:01Z"
}
```

### Config

#### Get Config

```http
GET /config
```

#### Update Config

```http
PUT /config
Content-Type: application/json

{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20250514"
}
```

### Models

#### List Available Models

```http
GET /models
```

**Response:**
```json
{
  "models": [
    {"id": "claude-3-5-sonnet-20250514", "provider": "anthropic"},
    {"id": "gpt-4o", "provider": "openai"}
  ]
}
```

## 3. WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:8765/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  api_key: 'your-api-key'
}));
```

### Message Format

```json
{
  "type": "message",
  "channel": "telegram",
  "data": {
    "content": "Hello!",
    "session_key": "telegram:123456:789"
  }
}
```

### Streaming Response

```json
{
  "type": "stream",
  "delta": "Hello",
  "done": false
}
```

```json
{
  "type": "stream",
  "delta": " there!",
  "done": true
}
```

### Multiplex Protocol

Multiple sessions over single WebSocket:

```json
{
  "type": "switch_session",
  "session_key": "discord:987654:321"
}
```

## 4. Python SDK

### Installation

```bash
pip install nanobot-ai
```

### Basic Usage

```python
from nanobot import Nanobot

# Initialize
nanobot = Nanobot(api_key="your-api-key")

# Send message
response = nanobot.chat(
    content="Hello!",
    session_key="my-session"
)
print(response.content)

# Async usage
import asyncio

async def main():
    response = await nanobot.chat_async(
        content="Hello!",
        session_key="my-session"
    )
    print(response.content)

asyncio.run(main())
```

### Session Management

```python
# List sessions
sessions = nanobot.list_sessions()

# Get session history
history = nanobot.get_history("my-session")

# Delete session
nanobot.delete_session("my-session")
```

### Configuration

```python
nanobot = Nanobot(
    api_key="your-key",
    provider="anthropic",
    model="claude-3-5-sonnet-20250514",
    config={
        "tools": ["filesystem", "shell", "web_search"],
        "temperature": 0.7
    }
)
```

## 5. SSE Streaming

### SSE Endpoint

```http
POST /chat/stream
Content-Type: application/json

{
  "content": "Write a story",
  "session_key": "telegram:123456:789"
}
```

### Response

```
data: {"delta": "Once", "done": false}

data: {"delta": " upon", "done": false}

data: {"delta": " a time", "done": true}

event: done
data: {"message_id": "msg_123", "usage": {"tokens": 150}}
```

## 6. CLI Reference

### Start Gateway

```bash
nanobot gateway
# Starts on http://localhost:8765
```

### Start with Channel

```bash
nanobot telegram --token "bot-token"
nanobot discord --token "bot-token"
```

### Interactive Mode

```bash
nanobot chat
# Starts interactive REPL
```

### Commands

| Command | Description |
|---------|-------------|
| `nanobot gateway` | Start API gateway |
| `nanobot chat` | Interactive REPL |
| `nanobot telegram --token TOKEN` | Start Telegram bot |
| `nanobot discord --token TOKEN` | Start Discord bot |
| `nanobot setup` | Interactive setup wizard |
| `nanobot status` | Show running status |

## 7. Gateway Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/sessions` | GET | List all sessions |
| `/api/v1/sessions/{key}` | GET | Get session details |
| `/api/v1/sessions/{key}` | DELETE | Delete session |
| `/api/v1/messages` | POST | Send message |
| `/api/v1/chat/stream` | POST | SSE streaming chat |
| `/api/v1/config` | GET | Get configuration |
| `/api/v1/config` | PUT | Update configuration |
| `/api/v1/models` | GET | List available models |
| `/ws` | WS | WebSocket connection |

## 8. WebUI

The React WebUI connects to the gateway:

```typescript
// webui/src/hooks/useWebSocket.ts
const ws = useWebSocket('ws://localhost:8765/ws', {
  auth: { api_key: '...' },
  session_key: 'webui:default:user',
});
```

Dev server proxies to gateway:
```typescript
// webui/vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:8765',
    '/ws': { target: 'ws://localhost:8765', ws: true },
  }
}
```
