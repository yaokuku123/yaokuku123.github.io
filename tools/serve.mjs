import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const output = path.resolve(
  fileURLToPath(new URL("../dist/", import.meta.url)),
);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".woff2": "font/woff2",
};
const reloadScript = `<script>const changes=new EventSource('/_dev/events');changes.addEventListener('reload',()=>location.reload());</script>`;
export function startServer({ port = 4173, liveReload = false } = {}) {
  const clients = new Set();
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      if (liveReload && pathname === "/_dev/events") {
        response.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        response.write(": connected\n\n");
        clients.add(response);
        request.on("close", () => clients.delete(response));
        return;
      }
      const file = path.resolve(
        output,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!file.startsWith(output + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      let data = await readFile(file);
      if (liveReload && path.extname(file) === ".html")
        data = Buffer.from(
          data.toString().replace("</body>", reloadScript + "</body>"),
        );
      response.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      response.end(data);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `Local: http://localhost:${server.address().port}${liveReload ? " (watching content and source)" : ""}`,
    ),
  );
  server.on("error", (error) => {
    console.error(`Preview failed: ${error.message}`);
    process.exitCode = 1;
  });
  return {
    server,
    notifyReload() {
      for (const client of clients)
        client.write("event: reload\ndata: updated\n\n");
    },
    close() {
      for (const client of clients) client.end();
      server.close();
    },
  };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  startServer({ port: Number(process.env.PORT || 4173) });
