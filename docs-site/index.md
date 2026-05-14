---
layout: home

hero:
  name: "nanobot Design"
  text: "Ultra-lightweight AI Agent Framework"
  tagline: "Architecture Design Documentation for nanobot - a Python async AI agent with React WebUI"
  image:
    src: /logo.svg
    alt: nanobot Design
  actions:
    - theme: brand
      text: Architecture Overview
      link: /architecture
    - theme: brand
      text: API Reference
      link: /api

features:
  - icon: 🏗️
    title: Architecture Overview
    details: Async MessageBus architecture, modular design, Python 3.11+ with asyncio throughout.
    link: /architecture
    linkText: View Architecture
  - icon: ⚙️
    title: Agent Loop
    details: AgentLoop session management, AgentRunner multi-turn conversation with tool execution.
    link: /agent-loop
    linkText: View Agent Loop
  - icon: 🔌
    title: LLM Providers
    details: Native SDK providers for OpenAI, Anthropic, Azure, and 10+ other providers via OpenAI-compatible API.
    link: /providers
    linkText: View Providers
  - icon: 💬
    title: Chat Channels
    details: "12+ integrations: Telegram, Discord, Slack, Feishu, WeChat, WhatsApp, Matrix, QQ, and more."
    link: /channels
    linkText: View Channels
  - icon: 🛠️
    title: Tools System
    details: Built-in tools for filesystem, shell, web search/fetch, MCP, cron, notebook, and subagent spawning.
    link: /tools
    linkText: View Tools
  - icon: 🧠
    title: Memory & Sessions
    details: Dream two-phase memory consolidation, atomic session writes, context auto-compaction.
    link: /memory
    linkText: View Memory
  - icon: 📡
    title: API Reference
    details: REST API, WebSocket multiplexing, Python SDK, SSE streaming support.
    link: /api
    linkText: View API
  - icon: 🚀
    title: Getting Started
    details: Quick start for developers - installation, configuration, channel setup, deployment.
    link: /getting-started
    linkText: View Guide
---
