import { describe, expect, it } from "vitest";
import { runCommand } from "../src/github-cli.mts";

describe("runCommand", () => {
  it("captures stdout and exit code 0 on success", () => {
    const result = runCommand("node", ["-e", 'process.stdout.write("hi")']);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("hi");
    expect(result.error).toBeUndefined();
  });

  it("captures non-zero exit code", () => {
    const result = runCommand("node", ["-e", "process.exit(3)"]);
    expect(result.status).toBe(3);
  });

  it("sets error for ENOENT (command not found)", () => {
    const result = runCommand("definitely-not-a-real-command-xyz", []);
    expect(result.error).toBeDefined();
    expect(result.status).toBeNull();
  });
});
