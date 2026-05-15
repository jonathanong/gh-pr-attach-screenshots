import { describe, expect, it } from "vitest";
import { upsertScreenshotsSection } from "../src/screenshots-section.mts";

const start = "<!-- agent-screenshots:start -->";
const end = "<!-- agent-screenshots:end -->";

describe("upsertScreenshotsSection", () => {
  it("appends a new managed section when none exists", () => {
    const result = upsertScreenshotsSection(
      "## Summary\n- Test\n",
      ["![img](https://github.com/user-attachments/assets/img)"],
      { replace: false },
    );
    expect(result).toContain("## Screenshots");
    expect(result).toContain(start);
    expect(result).toContain("assets/img");
    expect(result).toContain(end);
    expect(result).toMatch(/\n$/);
  });

  it("merges and deduplicates images in an existing section", () => {
    const existing = `## Summary\n\n## Screenshots\n${start}\n![a](https://x/a)\n${end}\n`;
    const result = upsertScreenshotsSection(existing, ["![a](https://x/a)", "![b](https://x/b)"], {
      replace: false,
    });
    expect(result.match(/x\/a/g)).toHaveLength(1);
    expect(result).toContain("x/b");
  });

  it("replaces only the managed block when replace is true", () => {
    const existing = [
      "## Summary\n- Keep\n",
      `## Screenshots\n${start}\n![old](https://x/old)\n${end}\n`,
      "## Validation\n- Keep\n",
    ].join("\n");
    const result = upsertScreenshotsSection(existing, ["![new](https://x/new)"], { replace: true });
    expect(result).not.toContain("x/old");
    expect(result).toContain("x/new");
    expect(result).toContain("## Validation");
    expect(result).toContain("## Summary");
  });

  it("handles a section without a ## Screenshots heading", () => {
    const existing = `Some text.\n${start}\n![a](https://x/a)\n${end}\n`;
    const result = upsertScreenshotsSection(existing, ["![b](https://x/b)"], { replace: false });
    expect(result).toContain("x/a");
    expect(result).toContain("x/b");
    expect(result).toContain("## Screenshots");
  });

  it("ignores non-image lines in the existing managed section when merging", () => {
    const existing = `## Screenshots\n${start}\nsome text\n![a](https://x/a)\n${end}\n`;
    const result = upsertScreenshotsSection(existing, ["![b](https://x/b)"], { replace: false });
    expect(result).toContain("x/a");
    expect(result).toContain("x/b");
    expect(result).not.toContain("some text");
  });

  it("trims and filters blank image markdown lines", () => {
    const result = upsertScreenshotsSection("## Summary\n", ["  ![a](https://x/a)  ", "  ", ""], {
      replace: false,
    });
    expect(result).toContain("![a]");
    expect(result).not.toContain("  ![a]");
  });

  it("returns updated body when replace is true and no existing section", () => {
    const result = upsertScreenshotsSection("## Summary\n", ["![a](https://x/a)"], {
      replace: true,
    });
    expect(result).toContain("x/a");
    expect(result).toContain("## Screenshots");
  });
});
