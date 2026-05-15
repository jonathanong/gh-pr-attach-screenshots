import { describe, expect, it } from "vitest";
import {
  HelpRequested,
  attachPrScreenshots,
  parseArgs,
  runCommand,
  upsertScreenshotsSection,
} from "../src/index.mts";

describe("index (public API barrel)", () => {
  it("re-exports all public functions and classes", () => {
    expect(typeof attachPrScreenshots).toBe("function");
    expect(typeof parseArgs).toBe("function");
    expect(typeof upsertScreenshotsSection).toBe("function");
    expect(typeof runCommand).toBe("function");
    expect(typeof HelpRequested).toBe("function");
    expect(new HelpRequested()).toBeInstanceOf(Error);
  });
});
