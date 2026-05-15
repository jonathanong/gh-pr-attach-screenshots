const sectionStart = "<!-- agent-screenshots:start -->";
const sectionEnd = "<!-- agent-screenshots:end -->";

export function upsertScreenshotsSection(
  body: string,
  imageMarkdown: string[],
  { replace }: { replace: boolean },
): string {
  const existingSection = findScreenshotsSection(body);
  const existingImages =
    existingSection === null || replace ? [] : screenshotLines(existingSection.content);
  const nextImages = dedupe([
    ...existingImages,
    ...imageMarkdown.map((line) => line.trim()).filter(Boolean),
  ]);
  const nextSection = renderScreenshotsSection(nextImages);

  if (existingSection === null) {
    return `${body.trimEnd()}\n\n${nextSection}\n`;
  }

  return `${body.slice(0, existingSection.start)}${nextSection}${body.slice(existingSection.end)}`;
}

function findScreenshotsSection(
  body: string,
): { content: string; end: number; start: number } | null {
  const startMarker = body.indexOf(sectionStart);
  const endMarker = body.indexOf(sectionEnd, startMarker + sectionStart.length);
  if (startMarker === -1 || endMarker === -1) {
    return null;
  }

  const headingStart = body.lastIndexOf("## Screenshots", startMarker);
  const start = headingStart === -1 ? startMarker : headingStart;
  const end = endMarker + sectionEnd.length;
  return {
    content: body.slice(startMarker + sectionStart.length, endMarker),
    end,
    start,
  };
}

function screenshotLines(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("![") && line.includes("](http"));
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

function renderScreenshotsSection(imageMarkdown: string[]): string {
  return ["## Screenshots", sectionStart, ...imageMarkdown, sectionEnd].join("\n");
}
