export type AttachScreenshotOptions = {
  images: string[];
  pr?: string;
  repo?: string;
  replace: boolean;
};

export class HelpRequested extends Error {
  constructor() {
    super(usage());
  }
}

export function parseArgs(args: string[]): AttachScreenshotOptions {
  const parsed: AttachScreenshotOptions = { images: [], replace: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;

    if (arg === "--replace") {
      parsed.replace = true;
      continue;
    }

    if (arg === "--pr") {
      parsed.pr = readOptionValue(args, index, "--pr");
      index += 1;
      continue;
    }

    if (arg.startsWith("--pr=")) {
      parsed.pr = arg.slice("--pr=".length);
      continue;
    }

    if (arg === "--repo") {
      parsed.repo = readOptionValue(args, index, "--repo");
      index += 1;
      continue;
    }

    if (arg.startsWith("--repo=")) {
      parsed.repo = arg.slice("--repo=".length);
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      throw new HelpRequested();
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option "${arg}".\n\n${usage()}`);
    }

    parsed.images.push(arg);
  }

  if (parsed.images.length === 0) {
    throw new Error(`At least one image path is required.\n\n${usage()}`);
  }

  return parsed;
}

function readOptionValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value === undefined || value.startsWith("-")) {
    throw new Error(`${option} requires a value.`);
  }
  return value;
}

function usage(): string {
  return [
    "Usage: gh-pr-attach-screenshots [--pr <number|branch|url>] [--repo owner/repo] [--replace] <image...>",
    "",
    "Uploads screenshots with gh-image and attaches them to the PR description.",
    "",
    "Options:",
    "  --pr <value>    PR number, branch name, or URL (defaults to current branch PR)",
    "  --repo <value>  Repository in owner/repo format (defaults to current repo)",
    "  --replace       Replace existing screenshots instead of merging",
    "  --help, -h      Show this help message",
    "",
    "Prerequisites:",
    "  - gh (GitHub CLI): brew install gh && gh auth login",
    "  - gh-image extension: gh extension install drogers0/gh-image",
    "    (may need to run outside any sandbox)",
  ].join("\n");
}
