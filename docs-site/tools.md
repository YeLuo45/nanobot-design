# Tools System

> Built-in tools expose agent capabilities to the LLM: filesystem, shell, web search, MCP, cron, notebook, and more.

## 1. Overview

Tools are functions the LLM can call during conversation. They are discovered via registry and exposed to the LLM as function definitions.

## 2. Tool Architecture

### Base Class

```python
# tools/base.py
class BaseTool(ABC):
    name: str
    description: str
    parameters: dict  # JSON Schema

    @abstractmethod
    async def execute(self, **kwargs) -> str:
        """Execute the tool with given arguments."""
        pass
```

### Tool Registry

```python
# tools/registry.py
class ToolRegistry:
    def __init__(self):
        self.tools: dict[str, BaseTool] = {}

    def discover_tools(self) -> None:
        """Scan nanobot.agent.tools package for tools."""
        for module in pkgutil.iter_modules(['nanobot/agent/tools']):
            if module.name not in ('base', 'registry', 'schema'):
                self.load_tool(module.name)

    def register(self, tool: BaseTool) -> None:
        self.tools[tool.name] = tool

    def get_tool_definitions(self) -> list[dict]:
        """Return JSON Schema for all tools (sent to LLM)."""
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters
            }
            for tool in self.tools.values()
        ]

    async def execute(self, name: str, args: dict) -> str:
        """Execute a tool by name."""
        tool = self.tools.get(name)
        if not tool:
            return f"Error: Unknown tool '{name}'"
        try:
            return await tool.execute(**args)
        except Exception as e:
            return f"Error executing {name}: {e}"
```

## 3. Built-in Tools

### Filesystem Tools

| Tool | Function | Description |
|------|----------|-------------|
| `read_file` | Read file contents | Read lines from a file |
| `read_multiple_files` | Read multiple files | Batch file reading |
| `edit_file` | Edit file contents | Replace lines in a file |
| `create_file` | Create new file | Write content to new file |
| `list_directory` | List directory | List files in a directory |
| `list_directory_tree` | Tree view | Recursive directory listing |
| `search_files` | Grep search | Search for pattern in files |

```python
# tools/filesystem.py
class ReadFileTool(BaseTool):
    name = "read_file"
    description = "Read lines from a file."

    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "File path to read"},
            "offset": {"type": "integer", "description": "Line offset"},
            "limit": {"type": "integer", "description": "Max lines"}
        },
        "required": ["path"]
    }

    async def execute(self, path: str, offset: int = 0, limit: int = 100) -> str:
        # Workspace isolation: only access allowed paths
        safe_path = self.validate_path(path)
        with open(safe_path) as f:
            lines = f.readlines()[offset:offset+limit]
        return ''.join(lines)
```

### Shell Tool

```python
# tools/shell.py
class ShellTool(BaseTool):
    name = "shell"
    description = "Execute shell commands."

    parameters = {
        "type": "object",
        "properties": {
            "command": {"type": "string", "description": "Shell command to execute"},
            "timeout": {"type": "integer", "description": "Timeout in seconds"}
        },
        "required": ["command"]
    }

    async def execute(self, command: str, timeout: int = 60) -> str:
        # Sandboxed execution
        result = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=self.workspace
        )
        stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=timeout)
        return stdout.decode() or stderr.decode()
```

### Web Search & Fetch

```python
# tools/search.py
class WebSearchTool(BaseTool):
    name = "web_search"
    description = "Search the web for information."

    parameters = {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "recency_days": {"type": "integer"},
            "source": {"type": "string", "enum": ["kagi", "google", "duckduckgo"]}
        },
        "required": ["query"]
    }

class WebFetchTool(BaseTool):
    name = "web_fetch"
    description = "Fetch content from a URL."

    parameters = {
        "type": "object",
        "properties": {
            "url": {"type": "string"},
            "prompt": {"type": "string"}
        },
        "required": ["url"]
    }
```

### Cron Tool

```python
# tools/cron.py
class CronTool(BaseTool):
    name = "cron"
    description = "Schedule a reminder or recurring task."

    parameters = {
        "type": "object",
        "properties": {
            "expression": {"type": "string", "description": "Cron expression or natural language"},
            "message": {"type": "string", "description": "Reminder message"}
        },
        "required": ["expression", "message"]
    }
```

### Notebook Tool

```python
# tools/notebook.py
class NotebookTool(BaseTool):
    name = "notebook"
    description = "Execute code in a Jupyter notebook."

    parameters = {
        "type": "object",
        "properties": {
            "code": {"type": "string"},
            "kernel": {"type": "string"}
        },
        "required": ["code"]
    }
```

### MCP Tools

```python
# tools/mcp.py
class MCPTool(BaseTool):
    name = "mcp"
    description = "Call an MCP server tool."

    parameters = {
        "type": "object",
        "properties": {
            "server": {"type": "string", "description": "MCP server name"},
            "tool": {"type": "string", "description": "Tool name on server"},
            "arguments": {"type": "object", "description": "Tool arguments"}
        },
        "required": ["server", "tool"]
    }
```

### Subagent Tool

```python
# tools/spawn.py
class SpawnTool(BaseTool):
    name = "spawn"
    description = "Spawn a subagent to handle a task."

    parameters = {
        "type": "object",
        "properties": {
            "prompt": {"type": "string"},
            "model": {"type": "string"},
            "tools": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["prompt"]
    }
```

### Self-Modification (MyTool)

```python
# tools/self.py
class SelfTool(BaseTool):
    name = "self"
    description = "Modify nanobot's own configuration or behavior."

    parameters = {
        "type": "object",
        "properties": {
            "action": {"type": "string", "enum": ["enable", "disable", "set"]},
            "target": {"type": "string"},
            "value": {"type": "any"}
        }
    }
```

## 4. Sandboxed Execution

Tools run in a sandboxed environment:

```python
# tools/sandbox.py
class Sandbox:
    def __init__(self, workspace: Path):
        self.workspace = workspace
        self.allowed_paths = [workspace]

    def validate_path(self, path: str) -> Path:
        """Ensure path is within workspace."""
        full_path = (self.workspace / path).resolve()
        if not str(full_path).startswith(str(self.workspace)):
            raise PermissionError(f"Path outside workspace: {path}")
        return full_path

    async def execute_shell(self, command: str) -> str:
        """Execute with restricted permissions."""
        # No network access, limited filesystem
        pass
```

## 5. Workspace Isolation

```python
# Default workspace
workspace = ~/.nanobot/workspace/{session_key}/

# File access restricted to workspace
safe_path = validate_path(requested_path, workspace)
```

## 6. Tool Configuration

```json
{
  "tools": {
    "enabled": ["filesystem", "shell", "web_search", "web_fetch", "cron"],
    "disabled": ["notebook"],
    "sandbox": {
      "enabled": true,
      "workspace": "~/.nanobot/workspace"
    }
  }
}
```

## 7. Custom Tools

### Register Custom Tool

```python
# In your config or plugin
registry.register(MyCustomTool())

# Or via decorator
@tool_registry.register
class MyTool(BaseTool):
    name = "my_tool"
    ...
```

## 8. Key Files

| File | Purpose |
|------|---------|
| `tools/base.py` | BaseTool abstract class |
| `tools/registry.py` | Tool discovery and execution |
| `tools/schema.py` | Tool parameter schemas |
| `tools/filesystem.py` | File read/write/edit/list |
| `tools/shell.py` | Shell execution |
| `tools/search.py` | Web search/fetch |
| `tools/mcp.py` | MCP server tools |
| `tools/cron.py` | Cron scheduling |
| `tools/notebook.py` | Jupyter notebook |
| `tools/spawn.py` | Subagent spawning |
| `tools/sandbox.py` | Sandboxed execution |
| `tools/self.py` | Self-modification |
