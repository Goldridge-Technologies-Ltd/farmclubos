/*
  Copies the official brand files into the calling app's public/brand, so every
  app serves the same /brand/… URLs (logo, favicon, social image) from one
  source. Each app runs it from its predev and prebuild scripts; the copies are
  gitignored. Edit the files in packages/design-system/brand, never the copies.
*/
import { cpSync, rmSync } from "node:fs";
import { join } from "node:path";

const source = join(import.meta.dirname, "..", "brand");
const target = join(process.cwd(), "public", "brand");

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
