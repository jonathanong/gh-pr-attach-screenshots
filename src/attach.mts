import { existsSync } from "node:fs";
import {
  type CommandRunner,
  editPrBody,
  ensureGhImageExtension,
  gh,
  runCommand,
  validateGh,
} from "./github-cli.mjs";
import { type AttachScreenshotOptions } from "./parse-args.mjs";
import { upsertScreenshotsSection } from "./screenshots-section.mjs";

export type { AttachScreenshotOptions };

export function attachPrScreenshots(
  options: AttachScreenshotOptions,
  runner: CommandRunner = runCommand,
): string {
  validateGh(runner);
  ensureGhImageExtension(runner);

  const repo =
    options.repo ??
    gh(runner, ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);
  const pr =
    options.pr ?? gh(runner, ["pr", "view", "--repo", repo, "--json", "number", "--jq", ".number"]);

  const imageMarkdown = options.images.map((image) => {
    if (!existsSync(image)) {
      throw new Error(`Screenshot not found: ${image}`);
    }
    return gh(runner, ["image", image, "--repo", repo]);
  });

  const body = gh(runner, ["pr", "view", pr, "--repo", repo, "--json", "body", "--jq", ".body"]);
  const nextBody = upsertScreenshotsSection(body, imageMarkdown, { replace: options.replace });
  editPrBody(runner, pr, repo, nextBody);

  process.stderr.write(`Attached ${imageMarkdown.length} screenshot(s) to PR #${pr} in ${repo}\n`);

  return nextBody;
}
