import { spawnSync, type SpawnSyncOptionsWithStringEncoding } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const extensionName = "drogers0/gh-image";

export type CommandResult = {
  error?: Error;
  status: number | null;
  stderr: string;
  stdout: string;
};

export type CommandRunner = (command: string, args: string[]) => CommandResult;

export function runCommand(command: string, args: string[]): CommandResult {
  const options: SpawnSyncOptionsWithStringEncoding = {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  };
  const result = spawnSync(command, args, options);
  return {
    error: result.error,
    status: result.status,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  };
}

export function formatCommandError(command: string, result: CommandResult): string {
  const detail = (result.error?.message ?? result.stderr.trim()) || result.stdout.trim();
  return detail ? `${command} failed: ${detail}` : `${command} failed.`;
}

export function gh(runner: CommandRunner, args: string[]): string {
  const result = runner("gh", args);
  if (result.status !== 0) {
    throw new Error(formatCommandError(`gh ${args.join(" ")}`, result));
  }
  return result.stdout.trim();
}

export function validateGh(runner: CommandRunner): void {
  const result = runner("gh", ["--version"]);
  if (result.error !== undefined || result.status !== 0) {
    throw new Error(
      [
        "`gh` (GitHub CLI) is not installed or not on PATH.",
        "",
        "Install it:",
        "  macOS:   brew install gh",
        "  Linux:   https://github.com/cli/cli#installation",
        "  Windows: winget install --id GitHub.cli",
        "",
        "Then authenticate:",
        "  gh auth login",
      ].join("\n"),
    );
  }
}

export function ensureGhImageExtension(runner: CommandRunner): void {
  const result = runner("gh", ["extension", "list"]);
  if (result.status !== 0) {
    throw new Error(formatCommandError("gh extension list", result));
  }
  if (result.stdout.includes(extensionName) || /^gh-image\b/m.test(result.stdout)) {
    return;
  }
  throw new Error(
    [
      "The `gh-image` extension is not installed.",
      "",
      "Install it (this may need to run outside any sandbox, as the extension",
      "stores credentials under ~/.config/gh):",
      "  gh extension install drogers0/gh-image",
      "",
      "Project: https://github.com/drogers0/gh-image",
    ].join("\n"),
  );
}

export function editPrBody(runner: CommandRunner, pr: string, repo: string, body: string): void {
  const dir = mkdtempSync(join(tmpdir(), "gh-pr-attach-screenshots-"));
  const bodyFile = join(dir, "body.md");
  try {
    writeFileSync(bodyFile, body);
    gh(runner, ["pr", "edit", pr, "--repo", repo, "--body-file", bodyFile]);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
}
