import Link from "next/link";
import {
  Play,
  Trophy,
  Zap,
  RotateCcw,
  WifiOff,
  BarChart2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#090d16] border border-slate-800 p-8 md:p-14 text-center">
        {/* Glow accents */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Cricket Scoring Engine
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Score Every Ball. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              Live, Fast & Seamless.
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto">
            From local club fixtures to international championship finals. Enjoy instant strike
            rotation, automated run rates, wicket flows, multi-level undo, and complete offline PWA scoring.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/matches/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-base px-6 py-3.5 rounded-xl shadow-neon transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-white" />
              Create New Match
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 font-semibold text-base px-6 py-3.5 rounded-xl transition-all"
            >
              Open Dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Live Scorecard Preview Card */}
        <div className="mt-12 max-w-2xl mx-auto cricket-card p-6 border-slate-800 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 live-blinker" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Live Match Demonstration
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">T20 • 20 Overs</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-400">India (Batting)</div>
              <div className="text-3xl font-black text-white score-digits flex items-baseline gap-2">
                182/4 <span className="text-base font-medium text-slate-400 font-mono">(19.2 ov)</span>
              </div>
              <div className="text-xs text-emerald-400 font-medium mt-1">
                CRR: 9.41 • Won by 6 wickets
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Australia</div>
              <div className="text-xl font-bold text-slate-300 score-digits">178/6 (20.0)</div>
              <div className="text-xs text-slate-500 mt-1">Target: 179</div>
            </div>
          </div>

          {/* Current Over Pill Timeline */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Recent Balls</span>
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
              <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-200">1</span>
              <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">4</span>
              <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">Wd</span>
              <span className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center">W</span>
              <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-200">2</span>
              <span className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center">6</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="cricket-card p-6 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Large One-Touch Scoring</h2>
          <p className="text-sm text-slate-400">
            Optimized for fast-paced live action. Runs, boundaries, extras, and wickets recorded with
            touch-friendly responsive keys designed specifically for mobile screens.
          </p>
        </div>

        <div className="cricket-card p-6 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Full Undo & Edit History</h2>
          <p className="text-sm text-slate-400">
            Mistakes happen. Instantly undo any ball and watch batsman figures, bowler economy, overs,
            and strike positions restore deterministically without data loss.
          </p>
        </div>

        <div className="cricket-card p-6 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <WifiOff className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Offline PWA Sync</h2>
          <p className="text-sm text-slate-400">
            Keep scoring uninterrupted on grounds with weak or zero cellular reception. Balls are
            stored safely in local storage and auto-synced the moment connection is restored.
          </p>
        </div>
      </section>
    </div>
  );
}
