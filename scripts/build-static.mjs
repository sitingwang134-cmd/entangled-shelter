import { spawnSync } from "node:child_process";
import "./build-original-roll.mjs";

// Export only browser assets for the NAS's existing Nginx container. The
// default local Node deployment retains its Shopify reference rewrite.
const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
  stdio: "inherit",
  env: { ...process.env, ENTANGLED_STATIC_EXPORT: "1" },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
