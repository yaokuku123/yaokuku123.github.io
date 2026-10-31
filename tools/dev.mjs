import { watch } from "node:fs";
import path from "node:path";
import { buildSite, projectRoot } from "./build.mjs";
import { startServer } from "./serve.mjs";
await buildSite();
const preview = startServer({
  port: Number(process.env.PORT || 4173),
  liveReload: true,
});
let timer,
  building = false,
  pending = false;
async function rebuild() {
  if (building) {
    pending = true;
    return;
  }
  building = true;
  try {
    await buildSite();
    preview.notifyReload();
  } catch (error) {
    console.error(
      `Content update rejected; keeping the previous site. ${error.message}`,
    );
  } finally {
    building = false;
    if (pending) {
      pending = false;
      rebuild();
    }
  }
}
const watchers = ["content", "src"].map((directory) =>
  watch(path.join(projectRoot, directory), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 120);
  }),
);
function stop() {
  clearTimeout(timer);
  watchers.forEach((watcher) => watcher.close());
  preview.close();
}
process.on("SIGINT", () => {
  stop();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stop();
  process.exit(0);
});
