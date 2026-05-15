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

Options:
  --pr <value>    PR number, branch name, or URL (defaults to current branch PR)
  --repo <value>  Repository in owner/repo format (defaults to current repo)
  --replace       Replace existing screenshots instead of merging
  --help, -h      Show this help message
```

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

## Agent usage notes

This tool is designed for use by AI agents. Key behaviors:

- **Fail-fast**: if `gh` or the `gh-image` extension is missing, the tool exits immediately with actionable install instructions.
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

## GitHub repository settings for auto-merge

The Dependabot auto-merge workflow requires two repository settings:

1. **Allow auto-merge** — Settings → General → Pull Requests → Allow auto-merge
2. **Allow GitHub Actions to create and approve pull requests** — Settings → Actions → General → Workflow permissions

If either is disabled, the workflow logs a warning and skips that step.
