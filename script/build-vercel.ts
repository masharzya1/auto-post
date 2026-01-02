import { build as viteBuild } from "vite";
import { rm, mkdir, copyFile } from "fs/promises";
import path from "path";

async function buildAll() {
  const root = process.cwd();
  const dist = path.join(root, "dist");
  
  await rm(dist, { recursive: true, force: true });
  
  console.log("building client...");
  await viteBuild();
  
  // Vercel sometimes needs index.html at the root of the output for some configs
  // and we ensure assets are accessible.
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
