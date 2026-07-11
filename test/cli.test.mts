import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/attach.mts");
vi.mock("../src/github-cli.mts");

import { main } from "../src/cli.mts";

describe("cli", () => {
  const savedArgv = process.argv.slice();
  let mockAttach: ReturnType<typeof vi.fn>;
  let mockCheck: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { attachPrScreenshots } = await import("../src/attach.mts");
    const { checkUploadCredentials } = await import("../src/github-cli.mts");
    mockAttach = vi.mocked(attachPrScreenshots);
    mockAttach.mockClear();
    mockAttach.mockReturnValue("");
    mockCheck = vi.mocked(checkUploadCredentials);
    mockCheck.mockClear();
    mockCheck.mockReturnValue({ stdout: "", stderr: "" });
    vi.spyOn(process, "exit").mockImplementation((code) => {
      throw Object.assign(new Error("process.exit"), { code });
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.argv = savedArgv.slice();
    vi.restoreAllMocks();
  });

  it("calls attachPrScreenshots with parsed options", () => {
    main(["--pr", "1", "image.png"]);
    expect(mockAttach).toHaveBeenCalledWith({
      pr: "1",
      repo: undefined,
      images: ["image.png"],
      replace: false,
    });
  });

  it("runs the standalone credential preflight without attaching", () => {
    mockCheck.mockReturnValue({ stdout: "octocat\n", stderr: "token valid\n" });
    main(["--check-upload-credentials"]);
    expect(mockCheck).toHaveBeenCalledOnce();
    expect(mockAttach).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith("octocat");
    expect(console.error).toHaveBeenCalledWith("token valid");
  });

  it("does not print empty credential diagnostics", () => {
    main(["--check-upload-credentials"]);
    expect(console.log).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("logs help and exits 0 for --help", () => {
    expect(() => main(["--help"])).toThrow();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it("logs help and exits 0 for -h", () => {
    expect(() => main(["-h"])).toThrow();
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it("logs error message and exits 2 for parse errors", () => {
    expect(() => main([])).toThrow();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("At least one image path is required"),
    );
    expect(process.exit).toHaveBeenCalledWith(2);
  });

  it("logs error message and exits 2 when attachPrScreenshots throws", () => {
    mockAttach.mockImplementation(() => {
      throw new Error("gh failed: auth error");
    });
    expect(() => main(["image.png"])).toThrow();
    expect(console.error).toHaveBeenCalledWith("gh failed: auth error");
    expect(process.exit).toHaveBeenCalledWith(2);
  });

  it("handles non-Error throws from attachPrScreenshots", () => {
    mockAttach.mockImplementation(() => {
      throw "string error";
    });
    expect(() => main(["image.png"])).toThrow();
    expect(console.error).toHaveBeenCalledWith("string error");
    expect(process.exit).toHaveBeenCalledWith(2);
  });

  it("runs main when the script is executed as the entry point", async () => {
    vi.resetModules();
    const cliPath = fileURLToPath(new URL("../src/cli.mts", import.meta.url));
    process.argv = ["node", cliPath, "--help"];
    try {
      await import("../src/cli.mts");
    } catch {
      // process.exit(0) was thrown by the mock
    }
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
  });
});
