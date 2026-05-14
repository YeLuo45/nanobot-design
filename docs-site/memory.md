# Memory & Sessions

> Dream two-phase memory consolidation, atomic session writes, and context auto-compaction.

## 1. Memory Architecture

### Two-Phase Dream Memory

nanobot uses a two-phase memory system called **Dream**:

| Phase | Description | Trigger |
|-------|-------------|---------|
| **Wake** | Normal conversation, memory accumulates | Every user message |
| **Dream** | Consolidation of recent events into long-term | Threshold or idle time |

### Memory Components

| Component | File | Responsibility |
|-----------|------|----------------|
| `Memory` | `agent/memory.py` | Dream two-phase consolidation |
| `SessionManager` | `session/manager.py` | Per-session history |
| `AutoCompactor` | `agent/autocompact.py` | Context truncation |

## 2. Session Management

```python
# session/manager.py
class SessionManager:
    def __init__(self, storage_dir: Path):
        self.sessions: dict[str, Session] = {}
        self.storage_dir = storage_dir

    def get_or_create(self, session_key: str) -> Session:
        if session_key not in self.sessions:
            self.sessions[session_key] = Session.load(
                self.storage_dir / f"{session_key}.json"
            )
        return self.sessions[session_key]

    def save(self, session_key: str) -> None:
        """Atomic write with fsync for durability."""
        session = self.sessions[session_key]
        session.save_atomic(self.storage_dir / f"{session_key}.json")
```

### Session Data

```python
class Session:
    session_key: str
    history: list[Message]        # Conversation history
    metadata: dict               # User preferences, etc.
    created_at: datetime
    updated_at: datetime
    last_active: datetime
    ttl: Optional[int]           # Auto-cleanup TTL
```

## 3. Dream Memory Consolidation

```python
# agent/memory.py
class DreamMemory:
    """
    Two-phase memory system:
    - Wake phase: Normal conversation, memory accumulates
    - Dream phase: Consolidation into summary
    """

    async def wake(self, session: Session, message: Message) -> None:
        """Wake phase: Add message to history."""
        session.history.append(message)

        # Check if dream should trigger
        if self.should_dream(session):
            await self.dream(session)

    async def dream(self, session: Session) -> None:
        """Dream phase: Consolidate recent events."""
        # 1. Get recent history (last N messages)
        recent = session.history[-self.dream_window:]

        # 2. Ask LLM to summarize key events
        summary = await self.summarize(recent)

        # 3. Update session metadata with summary
        session.metadata['dream_summary'] = summary

        # 4. Clear recent from history (keep summary)
        session.history = session.history[:-self.dream_window]

    async def summarize(self, messages: list[Message]) -> str:
        """Generate summary of recent events."""
        prompt = f"Summarize these conversation highlights: {messages}"
        response = await self.llm.chat([Message(role="user", content=prompt)])
        return response.content
```

## 4. Atomic Writes

```python
# session/manager.py
class Session:
    def save_atomic(self, path: Path) -> None:
        """Write to temp file, then rename (atomic on POSIX)."""
        temp_path = path.with_suffix('.tmp')
        with open(temp_path, 'w') as f:
            json.dump(self.to_dict(), f)
            f.flush()
            os.fsync(f.fileno())  # Ensure durability
        os.rename(temp_path, path)

    @classmethod
    def load(cls, path: Path) -> 'Session':
        """Load session, repair if corrupted."""
        try:
            with open(path) as f:
                return cls.from_dict(json.load(f))
        except (json.JSONDecodeError, FileNotFoundError):
            # Auto-repair corrupted session
            return cls.new(session_key=path.stem)
```

## 5. Context Auto-Compaction

When conversation exceeds token threshold:

```python
# agent/autocompact.py
class AutoCompactor:
    def __init__(self, max_tokens: int, threshold: float = 0.8):
        self.max_tokens = max_tokens
        self.threshold = threshold

    def should_compact(self, messages: list[Message]) -> bool:
        total = sum(self.count_tokens(m) for m in messages)
        return total > self.max_tokens * self.threshold

    async def compact(self, messages: list[Message]) -> list[Message]:
        """
        Compaction strategy:
        1. Keep system prompt intact
        2. Keep last N messages (recent context)
        3. Summarize older messages
        """
        # Keep system + recent
        system = [m for m in messages if m.role == "system"][:1]
        recent = messages[-20:]

        # Summarize middle
        middle = messages[len(system):-20]
        if middle:
            summary = await self.summarize(middle)
            compacted = system + [
                Message(role="system", content=f"[Earlier conversation summary: {summary}]")
            ] + recent
        else:
            compacted = system + recent

        return compacted

    async def summarize(self, messages: list[Message]) -> str:
        """Generate compact summary of old messages."""
        prompt = f"Condense this conversation into key points: {messages}"
        return await self.llm.chat([Message(role="user", content=prompt)])
```

## 6. Skill Discovery (Dream Phase)

Skills are discovered during Dream phase:

```python
# agent/skills.py
class SkillDiscovery:
    """
    Skills are discovered from:
    1. Configured skill directory
    2. Previously discovered skills (remembered across sessions)
    3. User instructions during conversation
    """

    def discover(self, session: Session) -> list[Skill]:
        skills = []

        # Load configured skills
        skills.extend(self.load_configured_skills())

        # Load previously discovered skills
        if 'discovered_skills' in session.metadata:
            skills.extend(session.metadata['discovered_skills'])

        # Learn new skills from conversation
        if self.should_dream(session):
            new_skills = await self.extract_skills(session.recent_history)
            session.metadata['discovered_skills'].extend(new_skills)

        return skills
```

## 7. Session TTL

```python
# Auto-cleanup inactive sessions
{
  "session": {
    "ttl_days": 30,           # Auto-delete after 30 days
    "max_history": 1000        # Max messages per session
  }
}
```

## 8. Key Files

| File | Purpose |
|------|---------|
| `agent/memory.py` | Dream two-phase memory |
| `agent/autocompact.py` | Context auto-compaction |
| `agent/skills.py` | Skill discovery system |
| `session/manager.py` | Session lifecycle, atomic writes |
