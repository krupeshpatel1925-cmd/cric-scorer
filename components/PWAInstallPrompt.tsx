"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Share, CheckCircle } from "lucide-react";
import { ClassicCricketBatBallIcon } from "./CricketLogo";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already in standalone app mode
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    if (standaloneMode) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
        .catch((err) => console.log("PWA SW registration error:", err));
    }

    // Android/Chrome beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // App installed listener
    window.addEventListener("appinstalled", () => {
      setIsStandalone(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      // Fallback instruction
      alert("To install, tap the 3 dots (⋮) in Chrome and select 'Install app' or 'Add to Home screen'.");
    }
  };

  // Don't show if already running inside installed standalone app, or dismissed
  if (isStandalone || dismissed) return null;

  // Show if installable event fired or if on mobile iOS
  const shouldShow = isInstallable || isIOS;

  return (
    <>
      {/* Floating Bottom Install Banner (Mobile optimized) */}
      {shouldShow && (
        <div className="fixed bottom-16 md:bottom-6 left-4 right-4 max-w-md mx-auto z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="cricket-card p-4 border-emerald-500/40 bg-slate-950/95 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-neon flex items-center justify-center shrink-0">
                <ClassicCricketBatBallIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  Install CricScorer App
                </h4>
                <p className="text-[11px] text-slate-400 truncate">
                  Fullscreen mobile scoring & offline access
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-neon flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Install
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Installation Helper Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="cricket-card p-6 border-slate-800 max-w-sm w-full space-y-4 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <p>
                  Tap the <strong className="text-white">Share</strong> button (
                  <Share className="w-3.5 h-3.5 inline text-blue-400 mx-0.5" />) in the Safari toolbar at the bottom.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <p>
                  Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong> (⊞).
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <p>
                  Tap <strong className="text-emerald-400">Add</strong> at top-right. CricScorer is now installed on your home screen!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-lg shadow-neon transition-all"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Standalone Install Button for navbar / menu
export function InstallAppButton({ className = "" }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      alert("On mobile: Open Chrome or Safari and tap 'Add to Home Screen' or 'Install App' from the browser menu.");
    }
  };

  return (
    <button
      onClick={handleInstall}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${className}`}
    >
      <Download className="w-3.5 h-3.5" /> Install App
    </button>
  );
}
