import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  editPrBody,
  ensureGhImageExtension,
  formatCommandError,
  gh,
  validateGh,
} from "../src/github-cli.mts";
import type { CommandResult } from "../src/github-cli.mts";

function ok(stdout = ""): CommandResult {
  return { status: 0, stderr: "", stdout };
}

function fail(opts: Partial<CommandResult> = {}): CommandResult {
  return { status: 1, stderr: "", stdout: "", ...opts };
}

describe("validateGh", () => {
  it("passes when gh returns exit 0", () => {
    expect(() => validateGh(() => ok("gh version 2.0.0"))).not.toThrow();
  });

  it("throws actionable message when gh is missing (ENOENT)", () => {
    expect(() => validateGh(() => fail({ error: new Error("ENOENT"), status: null }))).toThrow(
      "brew install gh",
    );
  });

  it("throws actionable message when gh returns non-zero", () => {
    expect(() => validateGh(() => fail({ status: 127 }))).toThrow("gh auth login");
  });
});

describe("ensureGhImageExtension", () => {
  it("passes when drogers0/gh-image is in the extension list", () => {
    expect(() => ensureGhImageExtension(() => ok("drogers0/gh-image\tv1.0\n"))).not.toThrow();
  });

  it("passes when gh-image is listed as a line prefix", () => {
    expect(() => ensureGhImageExtension(() => ok("gh-image\tsome/repo\tv1.0\n"))).not.toThrow();
  });

  it("throws fail-fast install instructions when extension is missing", () => {
    expect(() => ensureGhImageExtension(() => ok(""))).toThrow(
      "gh extension install drogers0/gh-image",
    );
  });

  it("fail-fast message mentions sandbox warning", () => {
    expect(() => ensureGhImageExtension(() => ok(""))).toThrow("sandbox");
  });

  it("throws formatted error when extension list command fails", () => {
    expect(() => ensureGhImageExtension(() => fail({ stderr: "auth error" }))).toThrow(
      "gh extension list failed: auth error",
    );
  });

  it("returns the installed extension metadata", () => {
    expect(ensureGhImageExtension(() => ok("gh image\tdrogers0/gh-image\tv1.1.0\n"))).toBe(
      "gh image\tdrogers0/gh-image\tv1.1.0",
    );
  });
});

describe("gh", () => {
  it("returns trimmed stdout on success", () => {
    expect(gh(() => ok("  hello\n"), ["test"])).toBe("hello");
  });

  it("throws formatted error on non-zero status", () => {
    expect(() => gh(() => fail({ stderr: "oops" }), ["subcmd"])).toThrow("gh subcmd failed: oops");
  });
});

describe("formatCommandError", () => {
  it("includes error.message when present", () => {
    expect(formatCommandError("cmd", fail({ error: new Error("ENOENT"), status: null }))).toContain(
      "ENOENT",
    );
  });

  it("falls back to stderr when no error", () => {
    expect(formatCommandError("cmd", fail({ stderr: "stderr msg" }))).toContain("stderr msg");
  });

  it("falls back to stdout when stderr is empty", () => {
    expect(formatCommandError("cmd", fail({ stdout: "stdout msg" }))).toContain("stdout msg");
  });

  it("produces generic message when all fields are empty", () => {
    expect(formatCommandError("cmd", fail())).toBe("cmd failed.");
  });
});

describe("editPrBody", () => {
  it("writes body to a temp file and calls gh pr edit", () => {
    const calls: Array<{ args: string[]; command: string }> = [];
    let bodyFileArg: string | undefined;

    editPrBody(
      (command, args) => {
        calls.push({ args, command });
        const idx = args.indexOf("--body-file");
        if (idx !== -1) bodyFileArg = args[idx + 1];
        return ok();
      },
      "42",
      "owner/repo",
      "new body",
    );

    expect(calls.some((c) => c.args[0] === "pr" && c.args[1] === "edit")).toBe(true);
    expect(bodyFileArg).toBeDefined();
    expect(existsSync(bodyFileArg!)).toBe(false);
  });

  it("removes the temp directory even when gh pr edit fails", () => {
    let tempDir: string | undefined;

    expect(() =>
      editPrBody(
        (_command, args) => {
          if (args[0] === "pr") {
            const idx = args.indexOf("--body-file");
            if (idx !== -1) tempDir = join(args[idx + 1]!, "..");
            return fail({ stderr: "network error" });
          }
          return ok();
        },
        "1",
        "owner/repo",
        "body",
      ),
    ).toThrow();

    expect(tempDir).toBeDefined();
    expect(existsSync(tempDir!)).toBe(false);
  });
});
