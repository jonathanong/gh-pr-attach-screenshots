import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { attachPrScreenshots } from "../src/attach.mts";
import type { CommandResult, CommandRunner } from "../src/github-cli.mts";

type Call = { args: string[]; command: string };

const testDirs: string[] = [];

afterEach(() => {
  for (const dir of testDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

function makeImage(): string {
  const dir = mkdtempSync(join(tmpdir(), "attach-test-"));
  testDirs.push(dir);
  const image = join(dir, "screenshot.png");
  writeFileSync(image, "fake");
  return image;
}

function ok(stdout = ""): CommandResult {
  return { status: 0, stderr: "", stdout };
}

function fail(stderr = ""): CommandResult {
  return { status: 1, stderr, stdout: "" };
}

function createRunner({
  body = "## Summary\n- Test\n",
  extensionList = "drogers0/gh-image",
  repo = "owner/repo",
  pr = "1",
}: {
  body?: string;
  extensionList?: string;
  pr?: string;
  repo?: string;
} = {}): { calls: Call[]; runner: CommandRunner } {
  const calls: Call[] = [];
  const runner: CommandRunner = (command, args) => {
    calls.push({ command, args });
    const line = [command, ...args].join(" ");
    if (line === "gh --version") return ok("gh version 2.0.0");
    if (line === "gh extension list") return ok(extensionList);
    if (line === "gh repo view --json nameWithOwner --jq .nameWithOwner") return ok(repo);
    if (line === `gh pr view --repo ${repo} --json number --jq .number`) return ok(pr);
    if (args[0] === "image") {
      return ok(`![img](https://github.com/user-attachments/assets/${basename(args[1]!)})\n`);
    }
    if (line === `gh pr view ${pr} --repo ${repo} --json body --jq .body`) return ok(body);
    if (args[0] === "pr" && args[1] === "edit") return ok();
    return fail(`unexpected: ${line}`);
  };
  return { calls, runner };
}

describe("attachPrScreenshots", () => {
  it("attaches a screenshot and returns the new PR body", () => {
    const image = makeImage();
    const { calls, runner } = createRunner();
    const body = attachPrScreenshots(
      { images: [image], pr: "1", repo: "owner/repo", replace: false },
      runner,
    );
    expect(body).toContain("agent-screenshots:start");
    expect(calls.some((c) => c.args[0] === "image")).toBe(true);
    expect(calls.some((c) => c.args[0] === "pr" && c.args[1] === "edit")).toBe(true);
  });

  it("resolves repo and PR from gh when not provided", () => {
    const image = makeImage();
    const { calls, runner } = createRunner();
    attachPrScreenshots({ images: [image], replace: false }, runner);
    expect(calls.some((c) => c.args.includes("nameWithOwner"))).toBe(true);
    expect(calls.some((c) => c.args.includes("number"))).toBe(true);
  });

  it("throws actionable message when gh is missing", () => {
    const image = makeImage();
    expect(() =>
      attachPrScreenshots({ images: [image], replace: false }, () => ({
        error: new Error("ENOENT"),
        status: null,
        stderr: "",
        stdout: "",
      })),
    ).toThrow("brew install gh");
  });

  it("throws fail-fast message when gh-image extension is missing", () => {
    const image = makeImage();
    const { runner } = createRunner({ extensionList: "" });
    expect(() => attachPrScreenshots({ images: [image], replace: false }, runner)).toThrow(
      "gh extension install drogers0/gh-image",
    );
  });

  it("throws with the path when an image file does not exist", () => {
    const { runner } = createRunner();
    expect(() =>
      attachPrScreenshots({ images: ["/no/such/file.png"], replace: false }, runner),
    ).toThrow("Screenshot not found: /no/such/file.png");
  });

  it("replaces existing screenshots when replace is true", () => {
    const image = makeImage();
    const { runner } = createRunner({
      body: [
        "## Summary\n- Test",
        "## Screenshots",
        "<!-- agent-screenshots:start -->",
        "![old](https://github.com/user-attachments/assets/old)",
        "<!-- agent-screenshots:end -->",
      ].join("\n"),
    });
    const body = attachPrScreenshots(
      { images: [image], pr: "1", repo: "owner/repo", replace: true },
      runner,
    );
    expect(body).not.toContain("assets/old");
    expect(body).toContain("assets/");
  });

  it("prints a success message to stderr", () => {
    const image = makeImage();
    const { runner } = createRunner();
    const stderrSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    attachPrScreenshots({ images: [image], pr: "1", repo: "owner/repo", replace: false }, runner);
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining("Attached 1 screenshot(s) to PR #1 in owner/repo"),
    );
    stderrSpy.mockRestore();
  });
});
