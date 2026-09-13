#!/usr/bin/env python3
"""Capture Codex user prompts and final responses for the 8x assignment."""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


PROJECT = Path("/Users/deveshrathod/OpenSource/8x/nano").resolve()
LOG_DIR = PROJECT / ".agent-logs"
STATE_DIR = Path("/private/tmp/8x-agent-capture-state")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def read_event() -> dict:
    try:
        value = json.load(sys.stdin)
        return value if isinstance(value, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def safe_session_id(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "", value) or "unknown-session"


def lock_path() -> Path:
    return STATE_DIR / ".lock"


class FileLock:
    def __enter__(self):
        import fcntl

        STATE_DIR.mkdir(parents=True, exist_ok=True)
        self.handle = lock_path().open("a+")
        fcntl.flock(self.handle.fileno(), fcntl.LOCK_EX)
        return self

    def __exit__(self, *_args):
        import fcntl

        fcntl.flock(self.handle.fileno(), fcntl.LOCK_UN)
        self.handle.close()


def session_log(event: dict) -> Path:
    session_id = safe_session_id(str(event.get("session_id", "unknown-session")))
    state_file = STATE_DIR / f"{session_id}.json"
    if state_file.exists():
        state = json.loads(state_file.read_text())
        return Path(state["log_path"])

    created = utc_now()
    filename = f"{created.replace(':', '-').replace('.', '-')}_{session_id}.md"
    log_path = LOG_DIR / filename
    state_file.write_text(json.dumps({"log_path": str(log_path), "count": 0}, indent=2) + "\n")
    return log_path


def update_metadata(log_path: Path, *, count: int, model: str, prompt_time: str | None = None) -> None:
    text = log_path.read_text()
    text = re.sub(r"(?m)^total_exchanges: .*?$", f"total_exchanges: {count}", text)
    text = re.sub(r"(?m)^model: .*?$", f"model: {model}", text, count=1)
    if prompt_time:
        text = re.sub(r"(?m)^last_prompt_time: .*?$", f"last_prompt_time: {prompt_time}", text)
    log_path.write_text(text)


def handle_prompt(event: dict) -> None:
    prompt = str(event.get("prompt", ""))
    session_id = safe_session_id(str(event.get("session_id", "unknown-session")))
    model = str(event.get("model") or "unknown")
    timestamp = utc_now()
    log_path = session_log(event)

    if not log_path.exists():
        log_path.write_text(
            "---\n"
            f"session_id: {session_id}\n"
            f"date: {timestamp[:10]}\n"
            "author: Devesh36\n"
            f"model: {model}\n"
            "tool: codex-cli\n"
            "project: nano\n"
            "total_exchanges: 0\n"
            f"first_prompt_time: {timestamp}\n"
            f"last_prompt_time: {timestamp}\n"
            "---\n\n"
            f"# Session Log - {timestamp[:10]}\n\n"
            f"Session: `{session_id[:8]}` | Project: `nano` | Author: `Devesh36`\n\n"
            "---\n\n"
        )

    state_file = STATE_DIR / f"{session_id}.json"
    state = json.loads(state_file.read_text())
    count = int(state.get("count", 0)) + 1
    state.update({"count": count, "pending_prompt": count, "last_prompt_time": timestamp})
    state_file.write_text(json.dumps(state, indent=2) + "\n")

    with log_path.open("a") as handle:
        handle.write(
            f"[LOG_ENTRY type=PROMPT num={count} session={session_id[:8]}]\n"
            f"timestamp: {timestamp}\n"
            f"model: {model}\n\n"
            f"{prompt}\n\n\n"
        )
    update_metadata(log_path, count=count, model=model, prompt_time=timestamp)


def handle_stop(event: dict) -> None:
    session_id = safe_session_id(str(event.get("session_id", "unknown-session")))
    model = str(event.get("model") or "unknown")
    log_path = session_log(event)
    state_file = STATE_DIR / f"{session_id}.json"
    state = json.loads(state_file.read_text())
    count = int(state.get("count", 0))
    if not count or state.get("last_response_turn_id") == event.get("turn_id"):
        return

    timestamp = utc_now()
    response = event.get("last_assistant_message")
    if response is None:
        response = ""
    response = str(response)
    with log_path.open("a") as handle:
        handle.write(
            f"[LOG_ENTRY type=RESPONSE num={count} session={session_id[:8]}]\n"
            f"timestamp: {timestamp}\n"
            f"model: {model}\n\n"
            f"{response}\n\n\n"
        )
    state["last_response_turn_id"] = event.get("turn_id")
    state["pending_prompt"] = None
    state_file.write_text(json.dumps(state, indent=2) + "\n")


def main() -> int:
    event = read_event()
    # This global hook is intentionally scoped to this assignment repository.
    cwd = Path(str(event.get("cwd") or os.getcwd())).resolve()
    if cwd != PROJECT and PROJECT not in cwd.parents:
        return 0
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with FileLock():
        if event.get("hook_event_name") == "UserPromptSubmit":
            handle_prompt(event)
        elif event.get("hook_event_name") == "Stop":
            handle_stop(event)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
