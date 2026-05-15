#!/usr/bin/env node
import { attachPrScreenshots } from "./attach.mjs";
import { HelpRequested, parseArgs } from "./parse-args.mjs";

export function main(args: string[]): void {
  try {
    attachPrScreenshots(parseArgs(args));
  } catch (error) {
    if (error instanceof HelpRequested) {
      console.log(error.message);
      process.exit(0);
    }
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}

if (process.argv[1] === import.meta.filename) {
  main(process.argv.slice(2));
}
