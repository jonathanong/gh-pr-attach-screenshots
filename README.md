# gh-pr-attach-screenshots

Upload local screenshots with [`gh-image`](https://github.com/drogers0/gh-image) and attach them to a GitHub PR description.

Manages a `## Screenshots` section delimited by HTML comments so the tool can be run multiple times without duplicating images:

```markdown
## Screenshots

<!-- agent-screenshots:start -->

![screenshot](https://github.com/user-attachments/assets/...)

<!-- agent-screenshots:end -->
```

## Prerequisites

Both tools must be installed before running.

**GitHub CLI (`gh`)**

```sh
brew install gh    # macOS
gh auth login
```

See [cli.github.com](https://cli.github.com) for Linux/Windows install options.

**`gh-image` extension**

```sh
gh extension install drogers0/gh-image
```

Version 0.2.0 or newer is required for credential preflight support. Upgrade an older install with:

```sh
gh extension upgrade drogers0/gh-image
```

> This step may need to run **outside any sandbox** — the extension stores credentials
> under `~/.config/gh` and may read browser session tokens.

## Installation

```sh
npm install -g gh-pr-attach-screenshots
```

Or use it directly with `npx`:

```sh
npx gh-pr-attach-screenshots ./screenshot.png
```

## Usage

```
gh-pr-attach-screenshots [--pr <number|branch|url>] [--repo owner/repo] [--replace] <image...>
gh-pr-attach-screenshots --check-upload-credentials

Options:
  --pr <value>    PR number, branch name, or URL (defaults to current branch PR)
  --repo <value>  Repository in owner/repo format (defaults to current repo)
  --replace       Replace existing screenshots instead of merging
  --check-upload-credentials
                  Verify gh-image upload credentials without uploading
  --help, -h      Show this help message
```

Before browser QA or screenshot capture, check that upload credentials are available:

```sh
gh-pr-attach-screenshots --check-upload-credentials
```

This standalone mode checks only the browser-session credential used by `gh-image`. It does not
upload an image or verify repository write access or SAML authorization; the attachment command
still validates those requirements.

`gh-image` reads `GH_SESSION_TOKEN` when set and otherwise discovers a `user_session` cookie from a
supported browser. Prefer `GH_SESSION_TOKEN` for non-interactive use. Ordinary `GH_TOKEN` and GitHub
CLI personal access token credentials cannot authenticate GitHub image uploads.

> **Security:** A `user_session` token grants full account access. Treat it like a password, never
> pass it in command arguments, and never print it in logs. This wrapper intentionally has no
> `--token` option.

**Examples**

```sh
# Attach a screenshot to the current branch's PR
gh-pr-attach-screenshots ./desktop.png

# Attach multiple screenshots
gh-pr-attach-screenshots ./desktop.png ./mobile.png

# Replace existing screenshots
gh-pr-attach-screenshots --replace ./new-desktop.png

# Specify a PR and repo explicitly
gh-pr-attach-screenshots --pr 123 --repo owner/repo ./screenshot.png
```

## Programmatic API

```ts
import { attachPrScreenshots, parseArgs, upsertScreenshotsSection } from "gh-pr-attach-screenshots";

// Full attach flow
attachPrScreenshots({
  images: ["./screenshot.png"],
  pr: "123",
  repo: "owner/repo",
  replace: false,
});

// Parse CLI args
const options = parseArgs(["--pr", "123", "./screenshot.png"]);

// Upsert the screenshots section in a PR body string
const newBody = upsertScreenshotsSection(existingBody, imageMarkdown, { replace: false });
```

## Agent skill

Install this skill so your AI agent automatically knows how to use this tool:

```sh
npx skills add jonathanong/gh-pr-attach-screenshots -a claude-code
```

The [`skills`](https://www.npmjs.com/package/skills) CLI supports many agents besides Claude Code — pass a different `-a` flag for OpenAI Codex, Cursor, and others. The skill covers invocation, prerequisites, and the browser-screenshot recipe.

## Agent usage notes

This tool is designed for use by AI agents. Key behaviors:

- **Fail-fast**: if `gh` or the `gh-image` extension is missing, the tool exits immediately with actionable install instructions.
- **Credential preflight**: `--check-upload-credentials` verifies the upload session before browser QA without uploading or reading a PR.
- **Idempotent**: running the tool multiple times merges images without duplicates.
- **Success feedback**: after a successful attach, the tool prints to stderr:
  ```
  Attached N screenshot(s) to PR #<number> in <owner>/<repo>
  ```
- **Exit codes**: `0` on success or `--help`, `2` on error.

## Development

```sh
pnpm install
pnpm build        # compile src/*.mts → dist/*.mjs
pnpm typecheck    # type-check src + test
pnpm lint         # oxlint
pnpm format       # oxfmt
pnpm test         # run tests
pnpm test:coverage  # run tests with 100% coverage gate
```
