/**
 * SIAP SEKOLAH — Service Worker Registration Hook
 * Call usePWA() in root layout or _app to register the SW and
 * expose sync status throughout the app.
 */
"use client";

import { useEffect, useCallback, useState } from "react";
import { countPendingSyncs, getAllPendingSyncs, removePendingSync } from "@/lib/idb";
import type { SyncState } from "@/types";

export function usePWA() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: "synced",
    pending_count: 0,
    last_synced_at: null,
    error_message: null,
  });

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("[PWA] Service Worker registered:", registration.scope);

        // Listen for SW messages (e.g., TRIGGER_SYNC from background sync)
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "TRIGGER_SYNC") {
            syncPendingData();
          }
        });
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
      }
    };

    register();
  }, []);

  // Sync pending data to server
  const syncPendingData = useCallback(async () => {
    const pending = await getAllPendingSyncs();
    if (pending.length === 0) {
      setSyncState((prev) => ({
        ...prev,
        status: "synced",
        pending_count: 0,
        last_synced_at: new Date().toISOString(),
      }));
      return;
    }

    setSyncState((prev) => ({ ...prev, status: "pending" }));

    let successCount = 0;
    for (const item of pending) {
      try {
        const endpoint =
          item.type === "evaluation"
            ? "/api/evaluations"
            : "/api/parent-responses";

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });

        if (res.ok) {
          await removePendingSync(item.client_id);
          successCount++;
        }
      } catch {
        // Network error — will retry on next online event
      }
    }

    const remaining = await countPendingSyncs();
    setSyncState({
      status: remaining === 0 ? "synced" : "local",
      pending_count: remaining,
      last_synced_at: successCount > 0 ? new Date().toISOString() : null,
      error_message: remaining > 0 ? `${remaining} data belum tersinkron` : null,
    });
  }, []);

  // Trigger sync when online
  useEffect(() => {
    const handleOnline = () => {
      console.log("[PWA] Connection restored — syncing...");
      syncPendingData();
    };

    const handleOffline = () => {
      setSyncState((prev) => ({ ...prev, status: "local" }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync check
    syncPendingData();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncPendingData]);

  // Update pending count periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const count = await countPendingSyncs();
      setSyncState((prev) => ({
        ...prev,
        pending_count: count,
        status: count > 0 ? "local" : "synced",
      }));
    }, 10_000); // every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return { syncState, syncNow: syncPendingData };
}
