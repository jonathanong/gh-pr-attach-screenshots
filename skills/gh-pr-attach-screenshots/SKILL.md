---
name: gh-pr-attach-screenshots
description: Use this skill when the user asks to attach a screenshot to a GitHub PR, dog-food a UI change visually, or upload a local image into a pull request's description. Invokes the `gh-pr-attach-screenshots` CLI, which uploads images via `gh-image` and manages a `## Screenshots` section in the PR body.
---

## What it does

`gh-pr-attach-screenshots` uploads local image files via the [`drogers0/gh-image`](https://github.com/drogers0/gh-image) `gh` extension and upserts a delimited `## Screenshots` section in the PR description. Running it multiple times merges images without duplicates. `--replace` swaps the managed block entirely.

## When to use it

- User asks to "attach a screenshot to the PR" or "post this image on my PR"
- User shares a local image path and references an open PR
- After a visual UI change, to show before/after on the PR
- You (the agent) took a browser screenshot of a rendered page and want to surface it in the PR

## How to invoke

Run without installing (recommended for agents):

| Package manager | Command                                              |
| --------------- | ---------------------------------------------------- |
| npm             | `npx gh-pr-attach-screenshots ./screenshot.png`      |
| pnpm            | `pnpm dlx gh-pr-attach-screenshots ./screenshot.png` |
| yarn            | `yarn dlx gh-pr-attach-screenshots ./screenshot.png` |
| bun             | `bunx gh-pr-attach-screenshots ./screenshot.png`     |

Common variants:

```sh
# Attach multiple images
npx gh-pr-attach-screenshots ./desktop.png ./mobile.png

# Target a specific PR (accepts number, branch name, or URL)
npx gh-pr-attach-screenshots --pr 123 ./screenshot.png

# Replace the existing screenshots block instead of merging
npx gh-pr-attach-screenshots --replace ./new.png

# Explicit repo
npx gh-pr-attach-screenshots --repo owner/repo ./screenshot.png
```

Before browser QA or screenshot capture, run the credential-only preflight outside the sandbox:

```sh
pnpm dlx gh-pr-attach-screenshots --check-upload-credentials
```

Continue to visual QA if it fails, but skip capture performed solely for PR attachment and report
the exact diagnostic. The preflight performs no upload or PR operation. Repository write access and
SAML authorization are checked only by the final attachment.

`--pr` defaults to the current branch's PR. `--repo` defaults to the current repo.

## Prerequisites & fail-fast recovery

The tool exits non-zero immediately if prerequisites are missing and prints actionable instructions to stderr. Surface stderr verbatim to the user.

**`gh` not installed:**

```
brew install gh    # macOS
gh auth login
```

See [cli.github.com](https://cli.github.com) for Linux/Windows install options.

**`gh-image` extension not installed:**

```sh
gh extension install drogers0/gh-image
```

Version 0.2.0 or newer is required. Upgrade with
`gh extension upgrade drogers0/gh-image` if the preflight reports an unsupported extension.

> Run this command **outside any sandbox** — the extension stores credentials under `~/.config/gh` and may read browser session tokens.

`gh-image` prefers `GH_SESSION_TOKEN` and otherwise discovers a `user_session` cookie from a
supported browser. Ordinary `GH_TOKEN` and GitHub CLI personal access token credentials cannot
upload images. A session token grants full account access: treat it like a password and never put it
in arguments or logs. The wrapper intentionally provides no `--token` option.

**Image file not found:** the tool prints `Screenshot not found: <path>`. Check the path and retry.

## Success signal

On success the CLI prints to stderr and exits `0`:

```
Attached N screenshot(s) to PR #<number> in <owner>/<repo>
```

Consider the task complete when you see that line.

## Browser screenshot recipe

When you need to produce the image first:

1. Use the available browser MCP tool to navigate to the page and take a screenshot:
   - `mcp__claude-in-chrome__browser_take_screenshot`
   - `mcp__plugin_playwright_playwright__browser_take_screenshot`
2. Save to a temp file (e.g., /tmp/screenshot.png)
3. Run the CLI with that path.
4. Delete the temp file when done.
