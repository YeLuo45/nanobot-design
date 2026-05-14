# Getting Started

> Quick start guide for developers wanting to install, configure, and deploy nanobot.

## 1. Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | >= 3.11 | Required (asyncio throughout) |
| pip / pipx | Latest | Package installation |
| API Key | — | Anthropic, OpenAI, or compatible |

## 2. Installation

### pip

```bash
pip install nanobot-ai
```

### pipx (recommended)

```bash
pipx install nanobot-ai
```

### Development

```bash
git clone https://github.com/HKUDS/nanobot.git
cd nanobot
pip install -e .
```

## 3. Quick Start

### Interactive Setup

```bash
nanobot setup
```

The wizard will:
1. Ask for API provider (Anthropic, OpenAI, etc.)
2. Prompt for API key
3. Select channels (Telegram, Discord, etc.)
4. Configure initial settings

### Manual Configuration

```bash
# Create config file
mkdir -p ~/.nanobot
nano ~/.nanobot/config.json
```

```json
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20250514",
  "api_key": "sk-ant-...",
  "channels": ["telegram"],
  "tools": {
    "enabled": ["filesystem", "shell", "web_search", "web_fetch"]
  }
}
```

## 4. Running

### Gateway Only

```bash
nanobot gateway
# Starts API server on http://localhost:8765
```

### With Channels

```bash
nanobot telegram --token "your-bot-token"
nanobot discord --token "your-bot-token"
```

### Interactive Chat

```bash
nanobot chat
# Starts REPL for testing
```

## 5. Channel Setup

### Telegram

1. Create bot via [@BotFather](https://t.me/BotFather)
2. Get bot token
3. Add to config:

```json
{
  "channels": ["telegram"],
  "telegram": {
    "bot_token": "123456:ABC-..."
  }
}
```

### Discord

1. Create application at [Discord Developer Portal](https://discord.com/developers)
2. Add bot to server
3. Get bot token
4. Add to config:

```json
{
  "channels": ["discord"],
  "discord": {
    "bot_token": "...",
    "guild_ids": ["123456789"]
  }
}
```

### Feishu

1. Create app at [Feishu Open Platform](https://open.feishu.cn/)
2. Get App ID and App Secret
3. Configure webhook URL
4. Add to config:

```json
{
  "channels": ["feishu"],
  "feishu": {
    "app_id": "...",
    "app_secret": "...",
    "verification_token": "..."
  }
}
```

## 6. WebUI

### Start WebUI

```bash
nanobot gateway
# Then in another terminal:
cd webui && bun run dev
```

### Access

Open http://localhost:5173 in browser.

## 7. Docker Deployment

### docker-compose.yml

```yaml
version: '3.8'
services:
  nanobot:
    build: .
    ports:
      - "8765:8765"
    volumes:
      - ~/.nanobot:/home/nanobot/.nanobot
    environment:
      - NANOBOT_API_KEY=your-api-key
```

### Run

```bash
docker-compose up -d
```

## 8. Development

### Clone & Setup

```bash
git clone https://github.com/HKUDS/nanobot.git
cd nanobot
pip install -e ".[dev]"
```

### Testing

```bash
# Run all tests
pytest

# Run specific test
pytest tests/test_openai_api.py::test_function -v

# With coverage
pytest --cov=nanobot tests/
```

### Linting

```bash
ruff check nanobot/
```

### WebUI Development

```bash
cd webui
bun install
bun run dev
```

## 9. Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `provider` | string | required | LLM provider name |
| `model` | string | required | Model identifier |
| `api_key` | string | required | API key |
| `channels` | list | [] | Enabled channels |
| `tools.enabled` | list | all | Enabled tools |
| `tools.disabled` | list | [] | Disabled tools |
| `memory.max_tokens` | int | 100000 | Max context tokens |
| `session.ttl_days` | int | 30 | Session TTL |

## 10. Troubleshooting

### Import Error

```bash
# Ensure Python 3.11+
python --version

# Reinstall
pip uninstall nanobot-ai
pip install nanobot-ai
```

### Channel Not Responding

Check logs:
```bash
nanobot telegram --token "..." --verbose
```

### Memory Issues

Reduce context size:
```json
{
  "memory": {
    "max_tokens": 50000
  }
}
```

## 11. Resources

| Resource | URL |
|----------|-----|
| GitHub | https://github.com/HKUDS/nanobot |
| Documentation | https://nanobot.wiki |
| Discord | https://discord.gg/MnCvHqpUGB |
| PyPI | https://pypi.org/project/nanobot-ai |
