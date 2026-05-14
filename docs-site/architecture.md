# nanobot Architecture Overview

> nanobot is a lightweight, open-source AI agent framework written in Python with a React/TypeScript WebUI.

## 1. Core Design Philosophy

nanobot follows the spirit of OpenClaw, Claude Code, and Codex:
- **Keep the core small** — readable agent loop
- **Modular channels** — any chat platform can be a channel
- **Async throughout** — Python 3.11+ asyncio
- **Production-ready** — memory, tools, sandboxing out of the box

## 2. Technology Stack

| Layer | Technology | Details |
|-------|------------|---------|
| **Agent Core** | Python 3.11+ | asyncio, Pydantic, no heavy dependencies |
| **WebUI** | React 18 + TypeScript | Vite, WebSocket multiplex protocol |
| **API Gateway** | FastAPI / uvicorn | WebSocket, SSE streaming |
| **Session Storage** | localStorage + IndexedDB | Browser-side session persistence |
| **Build** | ruff (lint), pytest (test) | Code quality + async testing |

## 3. High-Level Architecture

### MessageBus Flow

```
External Platform → Channel → InboundMessage → MessageBus → AgentLoop
                                                                    ↓
                                                                    AgentRunner
                                                                    ↓
                                              OutboundMessage ← Response
                                                                    ↓
                                           Channel → External Platform
```

### Core Components

| Component | Path | Responsibility |
|-----------|------|---------------|
| `AgentLoop` | `nanobot/agent/loop.py` | Session management, context building, hooks |
| `AgentRunner` | `nanobot/agent/runner.py` | LLM conversation loop, tool execution |
| `MessageBus` | `nanobot/bus/queue.py` | Async message routing, decouples channels from core |
| `ProviderFactory` | `nanobot/providers/factory.py` | LLM provider instantiation |
| `ChannelManager` | `nanobot/channels/manager.py` | Channel discovery and coordination |
| `ToolRegistry` | `nanobot/agent/tools/registry.py` | Tool discovery and execution |

## 4. Directory Structure

```
nanobot/
├── nanobot/
│   ├── __init__.py
│   ├── __main__.py
│   ├── agent/                 # Core agent logic
│   │   ├── loop.py           # AgentLoop - session orchestration
│   │   ├── runner.py         # AgentRunner - LLM conversation
│   │   ├── memory.py         # Dream two-phase memory
│   │   ├── context.py        # Context building
│   │   ├── hook.py           # Lifecycle hooks
│   │   ├── autocompact.py    # Context auto-compaction
│   │   ├── subagent.py       # Subagent spawning
│   │   ├── skills.py         # Skill system
│   │   └── tools/            # Built-in tools
│   │       ├── registry.py   # Tool discovery
│   │       ├── filesystem.py  # File read/write/edit/list
│   │       ├── shell.py      # Shell execution
│   │       ├── search.py     # Web search/fetch
│   │       ├── mcp.py        # MCP server tools
│   │       ├── cron.py       # Scheduled reminders
│   │       ├── notebook.py   # Jupyter notebook editing
│   │       ├── spawn.py      # Subagent spawning
│   │       ├── sandbox.py    # Sandboxed execution
│   │       └── self.py       # Self-modification (MyTool)
│   ├── bus/                   # Async message bus
│   │   └── queue.py          # MessageBus implementation
│   ├── channels/              # Platform integrations
│   │   ├── base.py           # Channel base class
│   │   ├── manager.py        # Channel discovery
│   │   ├── telegram.py
│   │   ├── discord.py
│   │   ├── slack.py
│   │   ├── feishu.py
│   │   ├── weixin.py         # WeChat
│   │   ├── whatsapp.py
│   │   ├── matrix.py
│   │   ├── qq.py
│   │   ├── dingtalk.py
│   │   ├── msteams.py
│   │   ├── wecom.py
│   │   └── websocket.py      # WebSocket channel
│   ├── providers/            # LLM providers
│   │   ├── base.py           # Provider base class
│   │   ├── factory.py        # Provider factory
│   │   ├── registry.py       # Model discovery
│   │   ├── anthropic_provider.py
│   │   ├── openai_compat_provider.py
│   │   ├── azure_openai_provider.py
│   │   ├── bedrock_provider.py
│   │   ├── github_copilot_provider.py
│   │   ├── openai_codex_provider.py
│   │   └── transcription.py  # Whisper transcription
│   ├── config/               # Configuration
│   │   ├── schema.py         # Pydantic config schema
│   │   └── loader.py         # Config file loading
│   ├── session/              # Session management
│   │   └── manager.py        # Per-session history, TTL
│   ├── api/                  # REST API
│   ├── cli/                  # CLI commands
│   ├── web/                  # Web server / gateway
│   ├── cron/                 # Cron scheduling
│   ├── heartbeat/            # Heartbeat system
│   ├── skills/               # Skill system
│   └── utils/
├── webui/                    # React WebUI
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   └── vite.config.ts
├── bridge/                   # TypeScript services (WhatsApp bridge)
├── docs/                     # User documentation
└── tests/
```

## 5. Key Design Patterns

### 5.1 Async MessageBus

The `MessageBus` (`nanobot/bus/queue.py`) is an async queue that decouples channels from the agent:

```python
# Channel publishes without knowing agent details
await message_bus.publish(InboundMessage(
    platform=platform,
    channel_id=channel_id,
    user_id=user_id,
    content=content,
))

# AgentLoop consumes when ready
async for message in message_bus.subscribe():
    await agent_loop.handle(message)
```

### 5.2 Provider Registry

```python
# providers/registry.py
class ProviderRegistry:
    def get_provider(self, name: str) -> type[BaseProvider]:
        ...

# providers/factory.py
class ProviderFactory:
    def create(self, config: dict) -> LLMClient:
        ...
```

### 5.3 Channel Auto-Discovery

Channels are auto-discovered via `pkgutil` scan and entry-point plugins:

```python
# channels/manager.py
class ChannelManager:
    def discover(self):
        # Scan nanobot.channels package
        # Load entry-point plugins
```

### 5.4 Tool Registry

```python
# tools/registry.py
class ToolRegistry:
    def discover_tools(self):
        # Scan nanobot.agent.tools package
        # Load custom tools from config
        pass

    async def execute(self, tool_name: str, args: dict):
        ...
```

## 6. Data Flow

### 6.1 Message Lifecycle

```
1. Platform sends message to Channel
2. Channel creates InboundMessage and publishes to MessageBus
3. AgentLoop consumes message
4. AgentLoop builds context (session history + tools + skills)
5. AgentRunner starts LLM conversation loop:
   a. Send messages to LLM provider
   b. Receive response (may include tool calls)
   c. Execute tools if needed
   d. Repeat until no more tool calls
6. AgentLoop publishes OutboundMessage to MessageBus
7. Channel delivers response to platform
```

### 6.2 Session Context Building

```python
# agent/context.py
class ContextBuilder:
    def build(self, session: Session, message: str) -> list[Message]:
        # 1. Load session history
        # 2. Apply memory consolidation (Dream)
        # 3. Inject skills
        # 4. Inject tools
        # 5. Return formatted message list
```

## 7. Configuration

```json
// ~/.nanobot/config.json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "api_key": "sk-...",
  "channels": ["telegram", "discord"],
  "tools": {
    "enabled": ["filesystem", "shell", "web"],
    "disabled": []
  },
  "memory": {
    "max_tokens": 100000,
    "compaction_threshold": 0.8
  }
}
```

## 8. WebUI Architecture

The React WebUI talks to the gateway over WebSocket:

```
WebUI (React) ←→ WebSocket ←→ Gateway (:8765) ←→ AgentLoop
                     ↓
              /api, /webui, /auth
```

- Vite dev server proxies to gateway in development
- Production builds bundled into Python wheel
- Session state via localStorage + IndexedDB

## 9. Security

| Feature | Implementation |
|---------|---------------|
| Workspace isolation | Sandboxed file access |
| Shell sandbox | Restricted command execution |
| Credential encryption | API keys never logged |
| MCP auth | Custom headers per server |

See [`.agent/security.md`](https://github.com/HKUDS/nanobot/blob/main/.agent/security.md) for details.

## 10. Entry Points

| Interface | Entry Point |
|-----------|-------------|
| CLI | `nanobot.cli.commands` |
| Python SDK | `nanobot.nanobot` |
| Gateway | `nanobot gateway` |
| WebUI dev | `cd webui && bun run dev` |
