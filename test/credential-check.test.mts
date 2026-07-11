import { describe, expect, it } from "vitest";
import { checkUploadCredentials } from "../src/github-cli.mts";
import type { CommandResult } from "../src/github-cli.mts";

function ok(stdout = ""): CommandResult {
  return { status: 0, stderr: "", stdout };
}

function fail(options: Partial<CommandResult> = {}): CommandResult {
  return { status: 1, stderr: "", stdout: "", ...options };
}

describe("checkUploadCredentials", () => {
  it("requires gh-image 0.2.0 or newer", () => {
    expect(() =>
      checkUploadCredentials((_command, args) => {
        if (args[0] === "--version") return ok();
        return ok("gh image\tdrogers0/gh-image\tv0.1.9\n");
      }),
    ).toThrow("gh extension upgrade drogers0/gh-image");
  });

  it("requires a parseable gh-image version", () => {
    expect(() =>
      checkUploadCredentials((_command, args) => {
        if (args[0] === "--version") return ok();
        return ok("gh image\tdrogers0/gh-image\tunknown\n");
      }),
    ).toThrow("gh extension upgrade drogers0/gh-image");
  });

  it("accepts the minimum gh-image version", () => {
    expect(() =>
      checkUploadCredentials((_command, args) => {
        if (args[0] === "--version") return ok();
        if (args[0] === "extension") return ok("gh image\tdrogers0/gh-image\tv0.2.0\n");
        return ok("check-token");
      }),
    ).not.toThrow();
  });

  it("checks capability before credentials and returns diagnostics", () => {
    const calls: string[] = [];
    const diagnostics = checkUploadCredentials((command, args) => {
      calls.push([command, ...args].join(" "));
      if (args[0] === "--version") return ok("gh version 2.0.0");
      if (args[0] === "extension") return ok("gh image\tdrogers0/gh-image\tv0.3.0\n");
      if (args[0] === "image" && args[1] === "--help") return ok("check-token");
      if (args[0] === "image" && args[1] === "check-token") {
        return { status: 0, stdout: "octocat\n", stderr: "token valid\n" };
      }
      return fail();
    });
    expect(calls).toEqual([
      "gh --version",
      "gh extension list",
      "gh image --help",
      "gh image check-token",
    ]);
    expect(diagnostics).toEqual({ stdout: "octocat\n", stderr: "token valid\n" });
  });

  it("requires check-token capability", () => {
    expect(() =>
      checkUploadCredentials((_command, args) => {
        if (args[0] === "--version") return ok();
        if (args[0] === "extension") return ok("gh image\tdrogers0/gh-image\tv0.3.0\n");
        return ok("Usage: gh image <image>");
      }),
    ).toThrow("gh extension upgrade drogers0/gh-image");
  });

  it("preserves a capability command failure", () => {
    expect(() =>
      checkUploadCredentials((_command, args) => {
        if (args[0] === "--version") return ok();
        if (args[0] === "extension") return ok("gh image\tdrogers0/gh-image\tv0.3.0\n");
        return fail({ stderr: "extension failed" });
      }),
    ).toThrow("gh image --help failed: extension failed");
  });

  it("preserves missing credential diagnostics", () => {
    expect(() =>
      checkUploadCredentials((_command, args) => {
        if (args[0] === "--version") return ok();
        if (args[0] === "extension") return ok("gh image\tdrogers0/gh-image\tv0.3.0\n");
        if (args[1] === "--help") return ok("check-token");
        return fail({ stderr: "No GitHub session token found.\n" });
      }),
    ).toThrow("No GitHub session token found.");
  });

  it("preserves expired credential diagnostics from stdout", () => {
    expect(() =>
      checkUploadCredentials((_command, args) => {
        if (args[0] === "--version") return ok();
        if (args[0] === "extension") return ok("gh image\tdrogers0/gh-image\tv0.3.0\n");
        if (args[1] === "--help") return ok("check-token");
        return fail({ stdout: "Session token is invalid or expired.\n" });
      }),
    ).toThrow("Session token is invalid or expired.");
  });

  it("reports a generic credential command failure without diagnostics", () => {
    expect(() =>
      checkUploadCredentials((_command, args) => {
        if (args[0] === "--version") return ok();
        if (args[0] === "extension") return ok("gh image\tdrogers0/gh-image\tv0.3.0\n");
        if (args[1] === "--help") return ok("check-token");
        return fail();
      }),
    ).toThrow("gh image check-token failed.");
  });
});
