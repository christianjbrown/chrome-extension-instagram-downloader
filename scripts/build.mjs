// Bundles the two scripts and copies the static files into dist/, which is the
// folder Chrome loads with "Load unpacked".
import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
// What esbuild bundles, by the name each bundle is written under. The
// manifest names the bundles, and a test keeps the two in step.
import entryPoints from "./entries.json" with { type: "json" };

const outdir = "dist";
// The oldest Chrome the bundles are written for.
const chromeTarget = "chrome120";

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });
await build({
  entryPoints,
  outdir,
  bundle: true,
  format: "iife",
  target: chromeTarget,
  minify: false,
  sourcemap: false,
  legalComments: "none",
  logLevel: "info",
});
await cp("static", outdir, { recursive: true });
