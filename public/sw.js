const CACHE_NAME = "amarsalon-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/globals.css",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/owner/ledger",
  "/more",
];

// Install Event - Pre-cache critical application shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Pre-caching non-critical asset error:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Stale-While-Revalidate & Offline Navigation Fallback
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip API routes, admin routes, and download files
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
      url.pathname.endsWith(".apk")
  ) {
return;
  }

        // 1. Handle Navigation Requests (HTML Pages)
        if (event.request.mode === "navigate") {
          event.respondWith(
            fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  const clone = networkResponse.clone();
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clone);
                  });
                }
                return networkResponse;
              })
              .catch(async () => {
                // If offline, attempt exact match, then try fallback to cached root shell
                const cachedMatch = await caches.match(event.request);
                if (cachedMatch) return cachedMatch;
                const rootMatch = await caches.match("/");
                if (rootMatch) return rootMatch;
                return new Response("Offline", { status: 503, statusText: "Offline" });
              })
          );
          return;
        }

        // 2. Handle Next.js static assets, styles, scripts, fonts, and images
        if (
          url.pathname.startsWith("/_next/static/") ||
          event.request.destination === "style" ||
          event.request.destination === "script" ||
          event.request.destination === "image" ||
          event.request.destination === "font"
        ) {
          event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
              const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                  if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                      cache.put(event.request, clone);
                    });
                  }
                  return networkResponse;
                })
          .catch (() => cachedResponse);

return cachedResponse || fetchPromise;
      })
    );
  }
});

// Push Notification Event
self.addEventListener("push", (event) => {
  let data = { title: "AmarSalon", body: "আপনার সিরিয়ালের আপডেট এসেছে।" };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click Event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
