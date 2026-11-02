/**
 * Render settings for the PostgreSQL DBA series.
 * The browser defaults to the Chromium headless shell that ships with Playwright in this
 * environment, so Remotion does not need to download one. Override with REMOTION_BROWSER.
 */
import { Config } from "@remotion/cli/config";
import fs from "node:fs";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");

const candidates = [
  process.env.REMOTION_BROWSER,
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
].filter(Boolean) as string[];
const browser = candidates.find((p) => fs.existsSync(p));
if (browser) Config.setBrowserExecutable(browser);
