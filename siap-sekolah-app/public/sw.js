/**
 * SIAP SEKOLAH — PWA Service Worker
 * Strategy: Cache-First for static assets, Network-First for API calls
 *
 * Save as: public/sw.js
 * Register in: src/app/layout.tsx via <Script> or inline registration
 */

const CACHE_VERSION = "siap-sekolah-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// API routes to cache with Network-First strategy
const API_PATTERNS = [
  /\/api\/students/,
  /\/api\/configs/,
  /\/api\/batches/,
];

// ─── Install Event: Pre-cache static assets ────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Pre-caching static assets");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately without waiting for old SW to die
  self.skipWaiting();
});

// ─── Activate Event: Clean old caches ─────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("siap-sekolah-") && name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// ─── Fetch Event: Routing Strategy ────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST/PUT/DELETE go through normally)
  if (request.method !== "GET") return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // API routes: Network-First with cache fallback
  if (API_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets: Cache-First
  event.respondWith(cacheFirstStrategy(request));
});

// ─── Cache-First Strategy ──────────────────────────────────────
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Revalidate in background (Stale-While-Revalidate)
    updateCache(request, STATIC_CACHE);
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      const cache = await caches.open(STATIC_CACHE);
      return cache.match("/offline") || new Response("Offline", { status: 503 });
    }
    throw new Error("Network error and no cache available");
  }
}

// ─── Network-First Strategy ────────────────────────────────────
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    console.log(`[SW] Network failed, falling back to cache: ${request.url}`);
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ success: false, error: "Offline — data tidak tersedia" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// ─── Background Cache Update ───────────────────────────────────
async function updateCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response);
    }
  } catch {
    // Silent fail for background updates
  }
}

// ─── Background Sync: Flush pending evaluations ───────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-evaluations") {
    event.waitUntil(syncPendingEvaluations());
  }
});

async function syncPendingEvaluations() {
  console.log("[SW] Starting background sync of pending evaluations...");
  // Post message to all clients to trigger the sync
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach((client) => {
    client.postMessage({ type: "TRIGGER_SYNC" });
  });
}

// ─── Push Notifications (future use) ──────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "Siap Sekolah", {
      body: data.body || "",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
    })
  );
});
