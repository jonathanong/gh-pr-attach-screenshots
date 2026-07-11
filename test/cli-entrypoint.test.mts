import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

const testDirs: string[] = [];

afterEach(() => {
  for (const dir of testDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  testDirs.push(dir);
  return dir;
}

describe("CLI entrypoint", () => {
  beforeAll(() => {
    execFileSync("pnpm", ["run", "build"], { stdio: "pipe" });
  }, 30_000);

  it("runs through a symlink", () => {
    const dir = makeTempDir("gh-pr-attach-screenshots-symlink-");
    const link = join(dir, "gh-pr-attach-screenshots");
    symlinkSync(resolve("dist/cli.mjs"), link);

    const output = execFileSync(process.execPath, [link, "--help"], {
      encoding: "utf8",
    });

    expect(readlinkSync(link)).toContain("dist/cli.mjs");
    expect(output).toContain("--check-upload-credentials");
  });

  it("runs from a packed pnpm consumer", () => {
    const dir = makeTempDir("gh-pr-attach-screenshots-consumer-");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "cli-consumer", private: true, version: "1.0.0" }),
    );
    execFileSync("pnpm", ["pack", "--pack-destination", dir], { stdio: "pipe" });
    const tarballName = readdirSync(dir).find((file) => file.endsWith(".tgz"));
    expect(tarballName).toBeDefined();
    execFileSync("pnpm", ["add", join(dir, tarballName!)], { cwd: dir, stdio: "pipe" });

    const output = execFileSync("pnpm", ["exec", "gh-pr-attach-screenshots", "--help"], {
      cwd: dir,
      encoding: "utf8",
    });

    expect(output).toContain("--check-upload-credentials");
  }, 30_000);
});
