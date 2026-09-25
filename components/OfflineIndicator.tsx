"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check localStorage for offline queue count
    const checkQueue = () => {
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("cricket_scorer_offline_queue_")) {
          try {
            const items = JSON.parse(localStorage.getItem(key) || "[]");
            count += items.length;
          } catch {}
        }
      }
      setPendingCount(count);
    };

    checkQueue();
    const interval = setInterval(checkQueue, 3000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`fixed bottom-20 md:bottom-6 right-4 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold backdrop-blur border transition-all ${
        !isOnline
          ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
          : "bg-blue-500/20 border-blue-500/50 text-blue-300"
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 animate-pulse text-amber-400" />
          <span>Offline Mode — Scoring Saved Locally ({pendingCount} pending)</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Syncing {pendingCount} offline balls to server...</span>
        </>
      )}
    </div>
  );
}
