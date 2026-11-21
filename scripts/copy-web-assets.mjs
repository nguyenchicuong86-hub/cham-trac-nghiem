import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDirectory = path.join(projectRoot, "www");
const webFiles = [
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "service-worker.js",
  "src",
  "assets",
];

await rm(webDirectory, { recursive: true, force: true });
await mkdir(webDirectory, { recursive: true });
for (const file of webFiles) {
  await cp(path.join(projectRoot, file), path.join(webDirectory, file), { recursive: true });
}
