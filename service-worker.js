const CACHE_NAME = "cham-trac-nghiem-shell-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./src/main.js",
  "./src/answer-sheet.js",
  "./src/templates.js",
  "./src/grading.js",
  "./src/grading-ui.js",
  "./assets/icons/app-icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("cham-trac-nghiem-shell-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then(async (response) => {
        if (response.ok) {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          } catch (error) {
            console.error("Không lưu được tài nguyên ứng dụng để dùng ngoại tuyến:", error);
          }
        }
        return response;
      })
      .catch(async () => (await caches.match(request)) || new Response("Đang ngoại tuyến.", { status: 503 })),
  );
});
