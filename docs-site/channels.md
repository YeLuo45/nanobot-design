# Chat Channels

> 12+ platform integrations: Telegram, Discord, Slack, Feishu, WeChat, WhatsApp, and more.

## 1. Overview

Channels are platform integrations that receive messages and send responses. They publish `InboundMessage` events to the async MessageBus and subscribe to `OutboundMessage` events for responses.

## 2. Channel Architecture

### Base Class

```python
# channels/base.py
class BaseChannel(ABC):
    name: str

    @abstractmethod
    async def start(self) -> None:
        """Start listening for messages."""
        pass

    @abstractmethod
    async def stop(self) -> None:
        """Stop listening."""
        pass

    @abstractmethod
    async def send(self, destination: str, content: str | Message) -> None:
        """Send message to platform."""
        pass

    def publish(self, message: InboundMessage) -> None:
        """Publish message to MessageBus."""
        message_bus.publish(message)
```

### Channel Manager

```python
# channels/manager.py
class ChannelManager:
    def __init__(self):
        self.channels: dict[str, BaseChannel] = {}

    def discover(self) -> None:
        """Auto-discover channels via pkgutil scan."""
        for module in pkgutil.iter_modules(['nanobot/channels']):
            if module.name != 'base' and module.name != 'registry':
                self.load_channel(module.name)

    async def start_all(self) -> None:
        for channel in self.channels.values():
            await channel.start()

    async def stop_all(self) -> None:
        for channel in self.channels.values():
            await channel.stop()
```

## 3. Supported Channels

### Instant Messaging

| Channel | File | Features |
|---------|------|----------|
| **Telegram** | `telegram.py` | Text, media, inline buttons, threads |
| **Discord** | `discord.py` | Threads, slash commands, embeds, reactions |
| **Slack** | `slack.py` | Threads, reactions, rich messages |
| **Microsoft Teams** | `msteams.py` | Adaptive Cards |
| **DingTalk** | `dingtalk.py` | Rich media, custom keyboard |

### Chinese Platforms

| Channel | File | Features |
|---------|------|----------|
| **WeChat** | `weixin.py` | Text, media, voice, multimodal |
| **Feishu** | `feishu.py` | Streaming, threads, rich text, CardKit |
| **WeCom** | `wecom.py` | Enterprise WeChat |
| **QQ** | `qq.py` | Group chats, media |
| **MoChat** | `mochat.py` | Enterprise WeChat alternative |

### Other Platforms

| Channel | File | Features |
|---------|------|----------|
| **WhatsApp** | `whatsapp.py` | Media via bridge |
| **Matrix** | `matrix.py` | E2E encryption, media |
| **Email** | `email.py` | IMAP/SMTP |
| **WebSocket** | `websocket.py` | Browser WebSocket client |

## 4. Telegram Channel

```python
# channels/telegram.py
class TelegramChannel(BaseChannel):
    name = "telegram"

    async def start(self):
        self.bot = Bot(token=self.config['bot_token'])
        self.dispatcher = Dispatcher()

        # Register handlers
        self.dispatcher.message.register(self.handle_message)
        await self.dispatcher.start()

    async def handle_message(self, update: Update):
        message = InboundMessage(
            platform="telegram",
            channel_id=str(update.effective_chat.id),
            user_id=str(update.effective_user.id),
            content=update.text,
        )
        self.publish(message)

    async def send(self, destination: str, content: str):
        await self.bot.send_message(
            chat_id=int(destination),
            text=content
        )
```

### Features

- Text and media messages
- Inline keyboard buttons
- Thread replies
- Long message splitting
- Streaming responses
- Typing indicators

## 5. Discord Channel

```python
# channels/discord.py
class DiscordChannel(BaseChannel):
    name = "discord"

    async def start(self):
        intents = Intents.default()
        intents.messages = True
        self.client = Client(intents=intents)

        @self.client.event
        async def on_message(message):
            if message.author.bot:
                return
            inbound = InboundMessage(
                platform="discord",
                channel_id=str(message.channel.id),
                user_id=str(message.author.id),
                content=message.content,
            )
            self.publish(inbound)

        await self.client.start(self.config['bot_token'])
```

### Features

- Discord threads (thread-aware sessions)
- Slash commands
- Rich embeds
- Message reactions
- Long message splitting
- Streaming with done emoji

## 6. Feishu Channel

```python
# channels/feishu.py
class FeishuChannel(BaseChannel):
    name = "feishu"

    async def handle_event(self, event: dict):
        # Feishu event webhook
        message = InboundMessage(
            platform="feishu",
            channel_id=event['chat_id'],
            user_id=event['sender']['sender_id']['open_id'],
            content=event['message']['content'],
        )
        self.publish(message)
```

### Features

- SSE streaming responses
- Thread-aware sessions
- Rich text rendering
- Code block formatting
- CardKit support
- Global domain (Lark)

## 7. WeChat Channel

```python
# channels/weixin.py
class WeChatChannel(BaseChannel):
    name = "weixin"

    async def verify(self, params: dict):
        # WeChat verification endpoint
        return params['echostr']

    async def handle_message(self, xml: str):
        # XML message parsing
        parsed = self.parse_xml(xml)
        message = InboundMessage(
            platform="weixin",
            channel_id=parsed['FromUserName'],
            user_id=parsed['FromUserName'],
            content=parsed.get('Content', ''),
        )
        self.publish(message)
```

### Features

- Text and media messages
- Voice message transcription
- Typing indicators
- QR code / media resilience
- Multimodal alignment (images)

## 8. WebSocket Channel

```python
# channels/websocket.py
class WebSocketChannel(BaseChannel):
    """Browser WebSocket client channel."""
    name = "websocket"
```

### Protocol

```
WebUI ←→ WebSocket ←→ nanobot gateway

# Multiplex protocol
{
  "type": "message",
  "channel": "websocket",
  "data": {
    "content": "Hello",
    "session_key": "websocket:default:user123"
  }
}
```

## 9. Channel Configuration

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "bot_token": "123:ABC..."
    },
    "discord": {
      "enabled": true,
      "bot_token": "...",
      "guild_ids": ["123456"]
    },
    "feishu": {
      "enabled": true,
      "app_id": "...",
      "app_secret": "...",
      "verification_token": "..."
    }
  }
}
```

## 10. Channel Plugin System

Channels can be added as plugins:

```toml
# pyproject.toml
[project.entry-points."nanobot.channels"]
mychannel = "my_channel:MyChannel"
```

## 11. Key Files

| File | Purpose |
|------|---------|
| `channels/base.py` | BaseChannel abstract class |
| `channels/manager.py` | Channel discovery and lifecycle |
| `channels/registry.py` | Channel registry |
| `channels/telegram.py` | Telegram Bot API integration |
| `channels/discord.py` | Discord.py integration |
| `channels/slack.py` | Slack Bolt integration |
| `channels/feishu.py` | Feishu open platform |
| `channels/weixin.py` | WeChat official account |
| `channels/whatsapp.py` | WhatsApp Business API |
| `channels/matrix.py` | Matrix protocol |
| `channels/websocket.py` | WebSocket channel |
