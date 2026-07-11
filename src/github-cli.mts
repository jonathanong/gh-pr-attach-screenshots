import { spawnSync, type SpawnSyncOptionsWithStringEncoding } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const extensionName = "drogers0/gh-image";
const minimumCredentialCheckVersion = [0, 2, 0] as const;

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

export function ensureGhImageExtension(runner: CommandRunner): string {
  const result = runner("gh", ["extension", "list"]);
  if (result.status !== 0) {
    throw new Error(formatCommandError("gh extension list", result));
  }
  const extensionLine = result.stdout
    .split("\n")
    .find((line) => line.includes(extensionName) || /^gh(?:\s+|-)image\b/.test(line));
  if (extensionLine !== undefined) {
    return extensionLine;
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

function compareVersion(left: readonly number[], right: readonly number[]): number {
  for (let index = 0; index < 3; index += 1) {
    const difference = left[index]! - right[index]!;
    if (difference !== 0) return difference;
  }
  return 0;
}

function unsupportedGhImageError(): Error {
  return new Error(
    [
      "The installed `gh-image` extension does not support credential checks.",
      "Version 0.2.0 or newer is required.",
      "",
      "Upgrade it:",
      "  gh extension upgrade drogers0/gh-image",
    ].join("\n"),
  );
}

export type CommandDiagnostics = { stderr: string; stdout: string };

export function checkUploadCredentials(runner: CommandRunner = runCommand): CommandDiagnostics {
  validateGh(runner);
  const extensionLine = ensureGhImageExtension(runner);
  const versionMatch = extensionLine.match(/\bv?(\d+)\.(\d+)\.(\d+)\b/);
  if (
    versionMatch === null ||
    compareVersion(
      [Number(versionMatch[1]), Number(versionMatch[2]), Number(versionMatch[3])],
      minimumCredentialCheckVersion,
    ) < 0
  ) {
    throw unsupportedGhImageError();
  }

  const helpResult = runner("gh", ["image", "--help"]);
  if (helpResult.status !== 0) {
    throw new Error(formatCommandError("gh image --help", helpResult));
  }
  if (!/\bcheck-token\b/.test(`${helpResult.stdout}\n${helpResult.stderr}`)) {
    throw unsupportedGhImageError();
  }

  const result = runner("gh", ["image", "check-token"]);
  if (result.status !== 0) {
    const diagnostics = [result.stderr.trim(), result.stdout.trim()].filter(Boolean).join("\n");
    throw new Error(diagnostics || formatCommandError("gh image check-token", result));
  }
  return { stderr: result.stderr, stdout: result.stdout };
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
