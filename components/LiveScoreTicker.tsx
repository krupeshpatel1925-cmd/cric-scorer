"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayCircle, ShieldCheck, X } from "lucide-react";

interface TickerMatch {
  id: string;
  name: string;
  status: string;
  innings: Array<{
    inningsNumber: number;
    totalRuns: number;
    wickets: number;
    legalBalls: number;
    battingTeam: { shortName: string; color?: string | null };
  }>;
}

export default function LiveScoreTicker() {
  const [matches, setMatches] = useState<TickerMatch[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await fetch("/api/matches");
        if (res.ok) {
          const data = await res.json();
          // ONLY display matches currently in progress (LIVE / SUPER_OVER)
          // Completed matches are NEVER shown in the live ticker!
          const liveMatches = (data.matches || []).filter(
            (m: any) => m.status === "LIVE" || m.status === "SUPER_OVER"
          );
          setMatches(liveMatches);
        }
      } catch (e) {
        // Quietly handle network failure
      }
    }
    loadMatches();
    const interval = setInterval(loadMatches, 10000); // 10s live poll
    return () => clearInterval(interval);
  }, []);

  if (dismissed || matches.length === 0) return null;

  return (
    <div className="bg-slate-950/80 border-b border-slate-800/80 backdrop-blur text-xs py-2 px-4 overflow-x-auto whitespace-nowrap flex items-center justify-between gap-4 scrollbar-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold uppercase tracking-wider shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 live-blinker" />
          Live Scores
        </div>
        <div className="flex items-center gap-3">
          {matches.slice(0, 5).map((m) => {
            const currentInn = m.innings[m.innings.length - 1];
            const overs = currentInn
              ? `${Math.floor(currentInn.legalBalls / 6)}.${currentInn.legalBalls % 6}`
              : "0.0";
            const isLive = m.status === "LIVE";

            return (
              <Link
                key={m.id}
                href={isLive ? `/matches/${m.id}/live` : `/matches/${m.id}/scorecard`}
                className="inline-flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 px-3 py-1 rounded-full transition-colors shrink-0"
              >
                {isLive ? (
                  <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                    Live
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                    {m.status}
                  </span>
                )}
                <span className="font-medium text-slate-200">
                  {currentInn ? (
                    <>
                      {currentInn.battingTeam.shortName}{" "}
                      <span className="text-emerald-400 font-bold">
                        {currentInn.totalRuns}/{currentInn.wickets}
                      </span>{" "}
                      <span className="text-slate-400 text-[11px]">({overs} ov)</span>
                    </>
                  ) : (
                    m.name
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-slate-500 hover:text-white rounded transition-colors shrink-0"
        title="Close Ticker"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
