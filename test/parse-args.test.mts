import { describe, expect, it } from "vitest";
import { HelpRequested, parseArgs, parseCliArgs } from "../src/parse-args.mts";

describe("parseArgs", () => {
  it("keeps help precedence over invalid and conflicting arguments", () => {
    expect(() => parseArgs(["--unknown", "--check-upload-credentials", "--help"])).toThrow(
      HelpRequested,
    );
  });

  it("rejects credential check mode through the attachment API", () => {
    expect(() => parseArgs(["--check-upload-credentials"])).toThrow("standalone CLI mode");
  });

  it("parses all options", () => {
    expect(parseArgs(["--pr", "1", "--repo=owner/repo", "--replace", "a.png", "b.png"])).toEqual({
      pr: "1",
      repo: "owner/repo",
      replace: true,
      images: ["a.png", "b.png"],
    });
  });

  it("parses --pr= and --repo= inline forms", () => {
    expect(parseArgs(["--pr=123", "--repo=owner/repo", "img.png"])).toEqual({
      pr: "123",
      repo: "owner/repo",
      replace: false,
      images: ["img.png"],
    });
  });

  it("defaults replace to false and leaves pr/repo undefined", () => {
    expect(parseArgs(["img.png"])).toEqual({
      pr: undefined,
      repo: undefined,
      replace: false,
      images: ["img.png"],
    });
  });

  it("throws HelpRequested for --help", () => {
    expect(() => parseArgs(["--help"])).toThrow(HelpRequested);
  });

  it("throws HelpRequested for -h", () => {
    expect(() => parseArgs(["-h"])).toThrow(HelpRequested);
  });

  it("HelpRequested message contains Usage:", () => {
    expect(() => parseArgs(["--help"])).toThrow("Usage:");
  });

  it("HelpRequested message contains install instructions", () => {
    expect(() => parseArgs(["-h"])).toThrow("gh extension install drogers0/gh-image");
  });

  it("throws for unknown options", () => {
    expect(() => parseArgs(["--unknown", "img.png"])).toThrow('Unknown option "--unknown"');
  });

  it("unknown option error includes usage", () => {
    expect(() => parseArgs(["--unknown", "img.png"])).toThrow("Usage:");
  });

  it("throws when --pr has no value", () => {
    expect(() => parseArgs(["--pr"])).toThrow("--pr requires a value.");
  });

  it("throws when --pr is followed by another flag", () => {
    expect(() => parseArgs(["--pr", "--replace", "img.png"])).toThrow("--pr requires a value.");
  });

  it("throws when --repo has no value", () => {
    expect(() => parseArgs(["--repo"])).toThrow("--repo requires a value.");
  });

  it("throws when no images are provided", () => {
    expect(() => parseArgs([])).toThrow("At least one image path is required");
  });

  it("no-images error includes usage", () => {
    expect(() => parseArgs(["--pr", "1"])).toThrow("Usage:");
  });
});

describe("parseCliArgs", () => {
  it("parses the credential check mode", () => {
    expect(parseCliArgs(["--check-upload-credentials"])).toEqual({
      mode: "check-upload-credentials",
    });
  });

  it("parses attachment mode options with backward-compatible semantics", () => {
    expect(parseCliArgs(["--pr", "1", "--repo=owner/repo", "--replace", "a.png", "b.png"])).toEqual(
      {
        mode: "attach",
        options: {
          pr: "1",
          repo: "owner/repo",
          replace: true,
          images: ["a.png", "b.png"],
        },
      },
    );
  });

  it("accepts repeated credential check flags", () => {
    expect(parseCliArgs(["--check-upload-credentials", "--check-upload-credentials"])).toEqual({
      mode: "check-upload-credentials",
    });
  });

  it.each([
    ["an image", ["--check-upload-credentials", "image.png"]],
    ["--pr", ["--check-upload-credentials", "--pr", "1"]],
    ["--repo", ["--check-upload-credentials", "--repo", "owner/repo"]],
    ["--replace", ["--check-upload-credentials", "--replace"]],
  ])("rejects %s in credential check mode", (_label, args) => {
    expect(() => parseCliArgs(args)).toThrow(
      "--check-upload-credentials cannot be combined with attachment arguments",
    );
  });

  it("gives help precedence in credential check mode", () => {
    expect(() => parseCliArgs(["--check-upload-credentials", "image.png", "--help"])).toThrow(
      HelpRequested,
    );
  });
});
