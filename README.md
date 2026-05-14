# nanobot Design

Architecture Design Documentation for nanobot - the ultra-lightweight AI agent framework.

## Overview

This is an architecture design documentation site for [nanobot](https://github.com/HKUDS/nanobot), generated from source code analysis. nanobot is a lightweight, open-source AI agent framework inspired by OpenClaw, Claude Code, and Codex.

## Documentation

- [Architecture Overview](/architecture) — MessageBus, async design, directory structure
- [Agent Loop](/agent-loop) — AgentLoop orchestration, AgentRunner conversation loop
- [LLM Providers](/providers) — Native SDK providers: Anthropic, OpenAI, Azure, and 10+ more
- [Chat Channels](/channels) — 12+ platform integrations: Telegram, Discord, Slack, Feishu, WeChat
- [Tools System](/tools) — Built-in tools: filesystem, shell, web search, MCP, cron, notebook
- [Memory & Sessions](/memory) — Dream two-phase memory, atomic writes, auto-compaction
- [API Reference](/api) — REST API, WebSocket, Python SDK, SSE streaming
- [Getting Started](/getting-started) — Installation, configuration, deployment

## Technology Stack

| Layer | Technology |
|-------|------------|
| Agent Core | Python 3.11+, asyncio, Pydantic |
| WebUI | React 18 + TypeScript, Vite |
| API Gateway | FastAPI, WebSocket, SSE |
| Code Quality | ruff, pytest (async) |

## Core Architecture

```
MessageBus → AgentLoop → AgentRunner → LLM Provider
                      ↓
              Tool Registry → Tools (filesystem, shell, MCP, etc.)
```

## Key Features

- **Async MessageBus**: Decouples channels from agent core
- **12+ Channel Integrations**: Telegram, Discord, Slack, Feishu, WeChat, WhatsApp, Matrix
- **Native SDK Providers**: Anthropic, OpenAI, Azure (no litellm dependency)
- **Dream Memory**: Two-phase memory consolidation
- **Tool Sandboxing**: Safe workspace isolation

## License

nanobot is MIT licensed.

---

Built from [HKUDS/nanobot](https://github.com/HKUDS/nanobot) source code.
