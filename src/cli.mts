#!/usr/bin/env node
import { attachPrScreenshots } from "./attach.mjs";
import { realpathSync } from "node:fs";
import { checkUploadCredentials } from "./github-cli.mjs";
import { HelpRequested, parseCliArgs } from "./parse-args.mjs";

export function main(args: string[]): void {
  try {
    const parsed = parseCliArgs(args);
    if (parsed.mode === "check-upload-credentials") {
      const diagnostics = checkUploadCredentials();
      if (diagnostics.stdout.trim()) console.log(diagnostics.stdout.trim());
      if (diagnostics.stderr.trim()) console.error(diagnostics.stderr.trim());
      return;
    }
    attachPrScreenshots(parsed.options);
  } catch (error) {
    if (error instanceof HelpRequested) {
      console.log(error.message);
      process.exit(0);
    }
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}

if (process.argv[1] !== undefined && realpathSync(process.argv[1]) === import.meta.filename) {
  main(process.argv.slice(2));
}
