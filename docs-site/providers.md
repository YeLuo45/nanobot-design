# LLM Providers

> Native SDK providers for OpenAI, Anthropic, Azure, and OpenAI-compatible endpoints.

## 1. Overview

nanobot uses native SDKs (not litellm) for LLM providers:
- `openai` SDK for OpenAI-compatible APIs
- `anthropic` SDK for Anthropic APIs
- Direct implementations for other providers

## 2. Provider Architecture

### Base Class

```python
# providers/base.py
class BaseProvider(ABC):
    name: str
    supports_streaming: bool = True
    supports_tools: bool = True

    @abstractmethod
    async def chat(self, messages: list[Message]) -> Response:
        pass

    @abstractmethod
    async def stream(self, messages: list[Message]) -> AsyncIterator[Delta]:
        pass

    @abstractmethod
    async def count_tokens(self, text: str) -> int:
        pass
```

### Provider Discovery

```python
# providers/registry.py
class ProviderRegistry:
    _providers: dict[str, type[BaseProvider]] = {}

    @classmethod
    def register(cls, name: str, provider: type[BaseProvider]):
        cls._providers[name] = provider

    def get(self, name: str) -> BaseProvider:
        return cls._providers[name]()
```

### Factory

```python
# providers/factory.py
class ProviderFactory:
    def create(self, config: dict) -> LLMClient:
        provider_name = config.get('provider', 'openai')

        if provider_name == 'anthropic':
            return AnthropicProvider(config)
        elif provider_name == 'openai':
            return OpenAIProvider(config)
        elif provider_name == 'azure':
            return AzureOpenAIProvider(config)
        # ... etc
```

## 3. Supported Providers

### Native Providers

| Provider | SDK | Models |
|----------|-----|--------|
| **Anthropic** | `anthropic` | Claude 3.5, 3, Haiku |
| **OpenAI** | `openai` | GPT-4o, GPT-4-turbo, GPT-3.5 |
| **OpenAI Responses** | `openai` | o-series, responses API |
| **Azure OpenAI** | `openai` | GPT-4, GPT-3.5 (Azure deployment) |
| **GitHub Copilot** | `openai` | GPT-5, o-series |

### OpenAI-Compatible Providers

| Provider | Endpoint | Notes |
|----------|----------|-------|
| **Ollama** | `http://localhost:11434` | Local models |
| **LM Studio** | `http://localhost:1234` | Local models |
| **DeepSeek** | `https://api.deepseek.com` | DeepSeek-V4 |
| **OpenRouter** | `https://openrouter.ai` | Aggregated providers |
| **Kimi** | `https://api.moonshot.cn` | Kimi K2.6 |
| **StepFun** | `https://api.stepfun.com` | StepFun models |
| **MiniMax** | `https://api.minimax.chat` | MiniMax thinking |
| **VolcEngine** | `https://ark.cn-beijing.volces.com` | Volcano Engine |
| **Hugging Face** | `https://api-inference.huggingface.co` | Hugging Face Inference |
| **Olostep** | `https://api.olostep.com` | Web search integration |

## 4. Anthropic Provider

```python
# providers/anthropic_provider.py
class AnthropicProvider(BaseProvider):
    name = "anthropic"
    supports_streaming = True
    supports_tools = True

    async def chat(self, messages: list[Message]) -> Response:
        response = await self.client.messages.create(
            model=self.model,
            messages=self.format_messages(messages),
            tools=self.format_tools() if self.supports_tools else None,
            max_tokens=8192,
        )
        return self.format_response(response)

    async def stream(self, messages: list[Message]) -> AsyncIterator[Delta]:
        async with self.client.messages.stream(
            model=self.model,
            messages=self.format_messages(messages),
            tools=self.format_tools(),
        ) as stream:
            async for delta in stream:
                yield Delta(content=delta.content_block.text)
```

### Thinking Mode

```python
# Anthropic extended thinking
response = await client.messages.create(
    model="claude-sonnet-4-20250514",
    messages=messages,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000,
    }
)
```

### Prompt Caching

```python
# Cache frequently used prompts
response = await client.beta.messages.create(
    model="claude-sonnet-4-20250514",
    messages=messages,
    system=[{
        "type": "text",
        "cache_control": {"type": "ephemeral"}
    }]
)
```

## 5. OpenAI-Compatible Provider

```python
# providers/openai_compat_provider.py
class OpenAICompatProvider(BaseProvider):
    name = "openai-compat"

    def __init__(self, config: dict):
        self.base_url = config.get('base_url', 'https://api.openai.com/v1')
        self.api_key = config.get('api_key')
        self.model = config.get('model', 'gpt-4o')
        self.extra_headers = config.get('extra_headers', {})

    async def chat(self, messages: list[Message]) -> Response:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=self.format_messages(messages),
            tools=self.format_tools() if self.supports_tools else None,
            stream=False,
            **self.extra_headers
        )
        return self.format_response(response)
```

## 6. Azure OpenAI

```python
# providers/azure_openai_provider.py
class AzureOpenAIProvider(BaseProvider):
    name = "azure"

    def __init__(self, config: dict):
        self.azure_endpoint = config['azure_endpoint']
        self.azure_deployment = config['azure_deployment']
        self.api_version = config.get('api_version', '2024-02-01')

    async def chat(self, messages: list[Message]) -> Response:
        response = await self.client.chat.completions.create(
            model=self.azure_deployment,
            messages=messages,
            api_version=self.api_version
        )
        return self.format_response(response)
```

## 7. Bedrock (AWS)

```python
# providers/bedrock_provider.py
class BedrockProvider(BaseProvider):
    name = "bedrock"
    # Uses boto3 to call AWS Bedrock
```

## 8. Transcription

```python
# providers/transcription.py
class TranscriptionProvider:
    async def transcribe(self, audio_path: str) -> str:
        """Whisper transcription for voice messages."""
        return await self.client.audio.transcriptions.create(
            model="whisper-1",
            file=open(audio_path, "rb")
        )
```

## 9. Image Generation

```python
# providers/image_generation.py
class ImageGenerationProvider:
    async def generate(self, prompt: str, size: str = "1024x1024") -> str:
        """DALL-E, Imagen, or compatible endpoint."""
        response = await self.client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size
        )
        return response.data[0].url
```

## 10. Model Discovery

```python
# providers/registry.py
class ModelRegistry:
    def list_models(self, provider: str) -> list[Model]:
        """Fetch available models from provider API."""
        if provider == "openai":
            return self.openai_client.models.list()
        elif provider == "anthropic":
            return ["claude-3-5-sonnet-20250514", "claude-3-opus-20240229"]
```

## 11. Configuration

```json
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20250514",
  "api_key": "sk-ant-...",
  "thinking": {
    "enabled": true,
    "budget_tokens": 10000
  },
  "extra_headers": {
    "X-Custom-Header": "value"
  }
}
```

## 12. Key Files

| File | Purpose |
|------|---------|
| `providers/base.py` | BaseProvider abstract class |
| `providers/factory.py` | ProviderFactory for instantiation |
| `providers/registry.py` | Model discovery |
| `providers/anthropic_provider.py` | Anthropic SDK implementation |
| `providers/openai_compat_provider.py` | OpenAI-compatible API |
| `providers/azure_openai_provider.py` | Azure OpenAI |
| `providers/transcription.py` | Whisper transcription |
| `providers/image_generation.py` | Image generation |
