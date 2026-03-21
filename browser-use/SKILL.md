---
name: browser-use
description: Build AI agents that autonomously control web browsers using the browser-use library. Covers setup, the Agent/Browser API, common patterns, and best practices for web automation tasks.
agents:
  - claude
---

# browser-use

[browser-use](https://github.com/browser-use/browser-use) is an open-source Python library that lets LLM-powered agents autonomously control a web browser — navigating pages, clicking elements, filling forms, extracting data, and executing multi-step workflows — without pre-scripted selectors.

## When to use

Use this skill whenever the user wants to:

- Automate browser interactions (form submission, clicking, scrolling)
- Scrape or extract data from web pages
- Build an AI agent that browses the web to complete a task
- Integrate browser automation into a Python/LangChain/LlamaIndex application
- Replace fragile CSS-selector scripts with LLM-driven navigation

## Setup

### Install dependencies

```bash
# Recommended — fast resolver
uv add browser-use

# Or with pip
pip install browser-use

# Install the browser binary (Chromium)
playwright install chromium
```

### Set your API key

browser-use works with any LiteLLM-compatible model. For Claude:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

## Core API

### Minimal example

```python
import asyncio
from langchain_anthropic import ChatAnthropic
from browser_use import Agent

async def main():
    agent = Agent(
        task="Go to Hacker News and summarise the top 5 stories today.",
        llm=ChatAnthropic(model="claude-opus-4-6"),
    )
    result = await agent.run()
    print(result)

asyncio.run(main())
```

### Agent constructor

```python
Agent(
    task: str,                          # Natural-language task description
    llm,                                # LangChain-compatible chat model
    browser: Browser | None = None,     # Reuse an existing browser instance
    browser_context = None,             # Reuse an existing browser context
    controller = None,                  # Custom action registry
    max_steps: int = 100,               # Hard cap on agent steps
    max_failures: int = 3,              # Consecutive failures before abort
    generate_gif: bool = False,         # Save a replay GIF to disk
    sensitive_data: dict | None = None, # Secrets injected without logging
)
```

### Browser & BrowserContext

```python
from browser_use import Agent, Browser, BrowserConfig

browser = Browser(config=BrowserConfig(
    headless=False,          # Show the browser window
    disable_security=False,  # Keep default security; set True only for local testing
    extra_chromium_args=["--window-size=1920,1080"],
))

async with await browser.new_context() as ctx:
    agent = Agent(task="...", llm=llm, browser_context=ctx)
    await agent.run()
```

### Custom actions / tools

Extend the agent with your own Python functions:

```python
from browser_use import Agent, Controller

controller = Controller()

@controller.action("Save current page URL to a file")
async def save_url(browser_context):
    page = await browser_context.get_current_page()
    with open("urls.txt", "a") as f:
        f.write(page.url + "\n")
    return "Saved."

agent = Agent(task="Visit three news sites and save each URL.", llm=llm, controller=controller)
await agent.run()
```

### Sensitive data (passwords, tokens)

Pass secrets through `sensitive_data` so they never appear in logs or the LLM context:

```python
agent = Agent(
    task="Log in to my account using my credentials and download the invoice.",
    llm=llm,
    sensitive_data={"username": "alice@example.com", "password": "s3cret"},
)
```

Refer to the values in the task with `{username}` and `{password}` — the agent substitutes them at runtime.

## Common patterns

### Persistent session across runs

```python
browser = Browser()
ctx = await browser.new_context()

agent1 = Agent(task="Log in to the dashboard.", llm=llm, browser_context=ctx)
await agent1.run()

agent2 = Agent(task="Download all CSV exports.", llm=llm, browser_context=ctx)
await agent2.run()

await ctx.close()
await browser.close()
```

### Structured output

```python
from pydantic import BaseModel

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str

results: list[SearchResult] = await agent.run(
    output_schema=list[SearchResult]
)
```

### Async parallel agents

```python
import asyncio

tasks = ["Find the price of X on Amazon", "Find the price of X on eBay"]
agents = [Agent(task=t, llm=llm) for t in tasks]
results = await asyncio.gather(*[a.run() for a in agents])
```

## Best practices

1. **Be explicit in the task** — specify the start URL, the exact sequence of actions, and the expected output format.
2. **Use `sensitive_data`** for any credentials or tokens — never embed them in the task string.
3. **Set `max_steps`** to a reasonable bound to prevent runaway agents.
4. **Prefer headless=True in CI** and `headless=False` during local development for easy debugging.
5. **Reuse browser contexts** when chaining multiple related tasks to preserve session state (cookies, localStorage).
6. **Return structured Pydantic models** from `agent.run()` rather than parsing free-form strings downstream.
7. **Check `generate_gif=True`** to record a replay for debugging flaky runs.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `PlaywrightError: Executable doesn't exist` | Run `playwright install chromium` |
| Agent loops without making progress | Lower `max_failures`, simplify the task, or break it into sub-tasks |
| LLM context-length errors | Set `max_history_items` on the agent to trim old messages |
| Captcha / bot-detection blocks | Enable stealth mode via `BrowserConfig(extra_chromium_args=["--disable-blink-features=AutomationControlled"])` |

## Resources

- [GitHub — browser-use/browser-use](https://github.com/browser-use/browser-use)
- [Official documentation](https://docs.browser-use.com)
- [API reference](https://evgeny-kim.github.io/browser-use-docs/api-reference.html)
- [Example scripts](https://github.com/browser-use/browser-use/tree/main/examples)
