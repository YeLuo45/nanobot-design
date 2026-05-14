# Agent Loop

> The core processing engine: AgentLoop manages sessions, AgentRunner executes multi-turn LLM conversations.

## 1. Overview

The agent system has two main components:
- **`AgentLoop`** (`loop.py`): Orchestrates the turn — receives messages, builds context, coordinates response
- **`AgentRunner`** (`runner.py`): Executes the actual LLM conversation — sends messages, handles tool calls

## 2. AgentLoop

### Responsibilities

| Responsibility | Description |
|---------------|-------------|
| Session management | Create/get/update sessions per user |
| Context building | Assemble prompt with history, tools, skills |
| Hook execution | Call lifecycle hooks at key points |
| Message routing | Route messages to AgentRunner |
| Response delivery | Send response back via MessageBus |

### Session Key

```python
# loop.py
class AgentLoop:
    def get_session_key(self, platform: str, channel_id: str, user_id: str) -> str:
        """Unique key for this user's session across channels."""
        return f"{platform}:{channel_id}:{user_id}"
```

### Lifecycle Hooks

```python
# hook.py
class Hooks:
    async def on_message(self, ctx: Context) -> None:
        """Called when message is received."""
        pass

    async def on_compact(self, ctx: Context) -> None:
        """Called before context compaction."""
        pass

    async def on_tool_call(self, ctx: Context, tool: str, args: dict) -> None:
        """Called before tool execution."""
        pass
```

## 3. AgentRunner

### Responsibilities

| Responsibility | Description |
|---------------|-------------|
| LLM communication | Send/receive messages from provider |
| Tool execution | Call tools when LLM requests them |
| Response streaming | Stream tokens back as they arrive |
| Error handling | Retry on transient failures |
| Conversation loop | Loop until no more tool calls |

### Conversation Loop

```python
# runner.py
async def run(self, ctx: Context, messages: list[Message]) -> Response:
    while True:
        # 1. Send messages to LLM
        response = await self.llm.chat(messages)

        # 2. Check for tool calls
        if not response.tool_calls:
            return response  # Done

        # 3. Execute tools
        for tool_call in response.tool_calls:
            result = await self.tools.execute(
                name=tool_call.name,
                args=tool_call.arguments
            )
            # 4. Add tool result to messages
            messages.append(Message(
                role="tool",
                tool_call_id=tool_call.id,
                content=result
            ))

        # 5. Loop continues
```

## 4. Tool Execution

### Tool Call Flow

```
LLM requests tool_call
      ↓
AgentRunner receives tool_calls in response
      ↓
Check tool registry for tool
      ↓
Execute tool with args
      ↓
Return tool result to LLM
      ↓
LLM generates final response
```

### Tool Arguments

```python
# Tools receive typed arguments
@tool
async def read_file(path: str, lines: int = 100) -> str:
    """Read lines from a file."""
    with open(path) as f:
        return ''.join(f.readlines()[:lines])
```

## 5. Streaming

AgentRunner supports streaming responses:

```python
# SSE streaming for compatible providers
async def run_streaming(self, ctx: Context, messages: list[Message]):
    async for delta in self.llm.stream(messages):
        yield delta  # Stream token deltas

    # Tool calls still block until complete
    async for tool_result in self.run_with_tools(messages):
        yield tool_result
```

## 6. Error Handling

| Error Type | Handling |
|-----------|----------|
| LLM rate limit | Exponential backoff retry |
| LLM API error | Log and return error message |
| Tool execution error | Return error to LLM for retry |
| Session not found | Create new session |
| Provider not available | Fall back to alternate provider |

### Retry Logic

```python
async def call_with_retry(self, messages: list[Message], max_retries=3):
    for attempt in range(max_retries):
        try:
            return await self.llm.chat(messages)
        except RateLimitError:
            wait = 2 ** attempt
            await asyncio.sleep(wait)
        except APIError as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(1)
```

## 7. Context Building

```python
# context.py
class ContextBuilder:
    def build(self, session: Session, new_message: str) -> list[Message]:
        messages = []

        # 1. System prompt
        messages.append(Message(role="system", content=self.system_prompt))

        # 2. Session history (truncated if needed)
        messages.extend(session.history[-50:])

        # 3. Tool definitions
        messages.append(Message(
            role="system",
            content=self.format_tools(enabled_tools)
        ))

        # 4. New user message
        messages.append(Message(role="user", content=new_message))

        return messages
```

## 8. Auto-Compaction

When context exceeds threshold, automatic compaction occurs:

```python
# autocompact.py
class AutoCompactor:
    def should_compact(self, messages: list[Message]) -> bool:
        total_tokens = sum(self.count_tokens(m) for m in messages)
        return total_tokens > self.max_tokens * self.threshold

    async def compact(self, messages: list[Message]) -> list[Message]:
        # Summarize older messages
        summary = await self.summarize(messages[:-10])
        return [messages[0]] + summary + messages[-10:]
```

## 9. Key Files

| File | Purpose |
|------|---------|
| `nanobot/agent/loop.py` | AgentLoop orchestrator |
| `nanobot/agent/runner.py` | AgentRunner conversation loop |
| `nanobot/agent/context.py` | Context building |
| `nanobot/agent/hook.py` | Lifecycle hooks |
| `nanobot/agent/autocompact.py` | Context auto-compaction |
| `nanobot/agent/subagent.py` | Subagent spawning |
| `nanobot/agent/memory.py` | Dream memory consolidation |
