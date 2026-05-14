# nanobot Design - Specification

## 1. Project Overview

**Project Name:** nanobot Design
**Project Type:** Architecture Design Documentation Site
**Upstream Project:** [HKUDS/nanobot](https://github.com/HKUDS/nanobot)
**License:** MIT

### Project Summary

An architecture design documentation site for nanobot - an ultra-lightweight AI agent framework in Python with React WebUI, featuring async MessageBus architecture, 12+ chat channel integrations, and native LLM provider SDKs.

### Value Proposition

- Clear visualization of async MessageBus architecture
- Comprehensive channel integration documentation
- Tool system and sandboxing architecture
- Dream memory system documentation
- Developer onboarding guide

---

## 2. Technical Specification

### Platform

| Component | Technology |
|-----------|------------|
| Documentation Engine | VitePress |
| Deployment | GitHub Actions (workflow mode) |
| Theme | Custom dark theme (orange #f97316 + cyan #06b6d4) |

### File Structure

```
nanobot-design/
├── README.md
├── SPEC.md
├── docs-site/
│   ├── package.json
│   ├── index.md                  # VitePress home with features grid
│   ├── architecture.md           # MessageBus, async design, directory structure
│   ├── agent-loop.md            # AgentLoop, AgentRunner, tool execution
│   ├── providers.md             # LLM providers: Anthropic, OpenAI, Azure, etc.
│   ├── channels.md              # 12+ channels: Telegram, Discord, Slack, Feishu, WeChat
│   ├── tools.md                 # Built-in tools, sandboxing, workspace isolation
│   ├── memory.md                # Dream memory, atomic writes, auto-compaction
│   ├── api.md                   # REST API, WebSocket, Python SDK
│   ├── getting-started.md        # Dev guide: install, configure, deploy
│   └── .vitepress/
│       ├── config.mjs           # Nav, sidebar, base config
│       ├── theme/
│       │   ├── index.js         # Theme extension
│       │   └── style.css        # Dark orange/cyan theme
│       └── public/
│           └── logo.svg         # Cat face logo (nanobot's mascot)
└── .github/workflows/
    └── vitepress-pages.yml      # GitHub Actions workflow
```

---

## 3. Design Language

### Color Palette

| Role | Color | Usage |
|------|-------|-------|
| Primary | `#f97316` | Orange brand (nanobot mascot color) |
| Secondary | `#06b6d4` | Cyan accent |
| Background | `#0A0A0F` | Near-black dark background |
| Surface | `#12121A` | Cards, sidebar |
| Text Primary | `#F0F0F5` | Headings |
| Text Secondary | `#A0A0B0` | Body text |

### Typography

- System fonts via VitePress defaults
- Gradient hero titles (orange → cyan → blue)

### Visual Elements

- Cat face SVG logo (nanobot's mascot)
- Orange glow effects on hover cards
- Glass-morphism navbar

---

## 4. Documentation Content

### Required Pages

| Document | Description | Status |
|----------|-------------|--------|
| index.md | VitePress home with features grid | ✅ |
| architecture.md | MessageBus, async design, directory structure | ✅ |
| agent-loop.md | AgentLoop orchestration, AgentRunner | ✅ |
| providers.md | LLM providers: Anthropic, OpenAI, Azure, etc. | ✅ |
| channels.md | 12+ chat channel integrations | ✅ |
| tools.md | Built-in tools, sandboxing, workspace | ✅ |
| memory.md | Dream memory, atomic writes | ✅ |
| api.md | REST API, WebSocket, Python SDK | ✅ |
| getting-started.md | Dev guide | ✅ |

---

## 5. Deployment

### GitHub Pages

- **Repository:** YeLuo45/nanobot-design
- **URL:** https://yeluo45.github.io/nanobot-design/
- **Build Type:** workflow mode
- **Artifact:** `docs-site/.vitepress/dist/`

### GitHub Actions

- Trigger: Push to main/master, changes in `docs-site/**`
- Node: 20 LTS
- Package manager: pnpm

---

## 6. Upstream Project Details

| Aspect | Details |
|--------|---------|
| Language | Python 3.11+, TypeScript (WebUI) |
| Package Manager | pip / pipx (Python), bun (WebUI) |
| WebUI | React 18 + TypeScript + Vite |
| Gateway | FastAPI + WebSocket |
| LLM Providers | Native SDKs (openai, anthropic), no litellm |
| Channels | Telegram, Discord, Slack, Feishu, WeChat, WhatsApp, Matrix, QQ, DingTalk, WeCom, MSTeams, WebSocket |
| Tools | filesystem, shell, web, MCP, cron, notebook, spawn, sandbox |
| Memory | Dream two-phase consolidation |
| Testing | ruff (lint), pytest (async) |

---

## 7. Constraints & Notes

1. **Documentation only** — no code from upstream is included
2. **Static generation** — VitePress builds to static HTML
3. **Subdirectory deployment** — base path `/nanobot-design/`
4. **REST API upload** — used due to network blocking git push
5. **Theme consistency** — orange (#f97316) + cyan (#06b6d4) matching nanobot brand
