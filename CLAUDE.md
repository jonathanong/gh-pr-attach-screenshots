# gh-pr-attach-screenshots

> The canonical consumer-facing usage guide lives in `skills/gh-pr-attach-screenshots/SKILL.md`. The dog-fooding workflow below extends it for development work on this repo specifically.

## Dog-fooding: attach a PR screenshot

When you open or update a pull request for this project, dog-food the tool by attaching a screenshot of the PR to its own description:

1. Get the PR URL (e.g. from `gh pr view --json url --jq .url`)
2. Open the URL in a browser with `mcp__claude-in-chrome__navigate`
3. Take a screenshot with `mcp__claude-in-chrome__browser_take_screenshot` (or the gif creator) and save it to a temp file
4. Run the CLI to attach it:
   ```sh
   node --experimental-strip-types src/cli.mts <path-to-screenshot>
   ```
   Or, if the package is built:
   ```sh
   ./dist/cli.mjs <path-to-screenshot>
   ```

The tool will upload the image and update the PR body with a `## Screenshots` section.

## Development

```sh
pnpm install
pnpm build          # compile src/*.mts → dist/*.mjs
pnpm typecheck      # type-check src + test
pnpm test:coverage  # run tests with 100% coverage gate
./node_modules/.bin/oxlint --deny-warnings .   # lint
./node_modules/.bin/oxfmt --check .            # format check
./node_modules/.bin/oxfmt .                    # auto-format
```

> **Note on local linting**: `pnpm run lint` may be intercepted by local tooling (RTK hook). Run oxlint directly via the `./node_modules/.bin/` path instead.
