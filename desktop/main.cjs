const { app, BrowserWindow, session } = require("electron");
const { createServer } = require("node:http");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
]);

const webRoot = app.isPackaged
  ? path.join(process.resourcesPath, "app")
  : path.resolve(__dirname, "..", "www");
let server;
let appOrigin;

function serveFile(request, response) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, appOrigin).pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(webRoot, relativePath);
  if (filePath !== webRoot && !filePath.startsWith(`${webRoot}${path.sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  readFile(filePath).then((content) => {
    response.writeHead(200, {
      "Content-Type": MIME_TYPES.get(path.extname(filePath)) || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(content);
  }).catch((error) => {
    if (error.code === "ENOENT") {
      response.writeHead(404).end("Not found");
      return;
    }
    console.error("Unable to read app file:", error);
    response.writeHead(500).end("Unable to read app file");
  });
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 360,
    minHeight: 600,
    backgroundColor: "#f5f7fb",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.loadURL(appOrigin);
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback, details) => {
    callback(permission === "media" && details.mediaTypes?.includes("video"));
  });
  server = createServer(serveFile);
  server.listen(0, "127.0.0.1", () => {
    appOrigin = `http://127.0.0.1:${server.address().port}/`;
    createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => server?.close());
