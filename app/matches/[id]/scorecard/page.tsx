"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  PlayCircle,
  Award,
  ChevronDown,
  Clock,
  Sparkles,
} from "lucide-react";

export default function ScorecardPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeInningsTab, setActiveInningsTab] = useState(0);

  const loadScorecard = async () => {
    try {
      setErrorMsg(null);
      const res = await fetch(`/api/matches/${matchId}/scorecard`);
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || "Match scorecard not found.");
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to load match scorecard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScorecard();
  }, [matchId]);

  if (loading) return <div className="p-12 text-center text-slate-500 font-mono">Loading full match scorecard...</div>;
  if (!data || !data.match) {
    return (
      <div className="max-w-md mx-auto my-12 cricket-card p-8 border-slate-800 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">Scorecard Not Found</h2>
        <p className="text-xs text-slate-400">
          {errorMsg || "Match scorecard details could not be found."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setLoading(true);
              loadScorecard();
            }}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/matches"
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold shadow-neon transition-all"
          >
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  const match = data.match;
  const inningsList = data.innings || [];
  const currentTabInnings = inningsList[activeInningsTab] || inningsList[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back and Live CTA */}
      <div className="flex items-center justify-between">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Matches
        </Link>
        {match.status === "LIVE" && (
          <Link
            href={`/matches/${matchId}/live`}
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-neon transition-all"
          >
            <PlayCircle className="w-4 h-4" /> Live Scoring View
          </Link>
        )}
      </div>

      {/* MATCH SUMMARY HEADER */}
      <div className="cricket-card p-6 border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <span className="text-xs font-mono text-emerald-400 uppercase font-bold">
              {match.tournament || "Cricket Tournament"}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">{match.name}</h1>
            <p className="text-xs text-slate-400">
              {match.venue || "Stadium"} • {new Date(match.date).toLocaleDateString()} • {match.format} ({match.oversLimit} Overs)
            </p>
          </div>

          <span
            className={`self-start sm:self-auto text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
              match.status === "LIVE"
                ? "bg-red-500/20 text-red-400 border border-red-500/40 live-blinker"
                : "bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            {match.status}
          </span>
        </div>

        {/* Teams Score Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inningsList.map((inn: any) => (
            <div
              key={inn.id}
              className="p-4 rounded-xl cricket-score-pill flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-white text-base flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: inn.battingTeam.color || "#10b981" }}
                  />
                  <span className="truncate">{inn.battingTeam.name}</span>
                </div>
                <div className="text-xs text-slate-400">Innings {inn.inningsNumber}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white score-digits">
                  {inn.totalRuns}/{inn.wickets}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {inn.overs} ov (RR: {inn.runRate})
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Result & Player of the Match Banner */}
        {match.result && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> Match Result
              </div>
              <div className="text-lg font-black text-white">
                {(() => {
                  const winnerName =
                    match.result.winner?.name ||
                    match.teams?.find(
                      (t: any) => (t.id || t.teamId) === match.result.winnerId
                    )?.name;
                  if (
                    winnerName &&
                    match.result.margin &&
                    !match.result.margin
                      .toLowerCase()
                      .includes(winnerName.toLowerCase())
                  ) {
                    return `${winnerName} ${match.result.margin.charAt(0).toLowerCase() + match.result.margin.slice(1)}`;
                  }
                  return match.result.margin;
                })()}
              </div>
              {match.result.summary && (
                <p className="text-xs text-slate-300 mt-0.5">
                  {(() => {
                    const winnerName =
                      match.result.winner?.name ||
                      match.teams?.find(
                        (t: any) => (t.id || t.teamId) === match.result.winnerId
                      )?.name;
                    let s = match.result.summary;
                    if (
                      winnerName &&
                      s &&
                      s.toLowerCase().startsWith("won by") &&
                      !s.toLowerCase().includes(winnerName.toLowerCase())
                    ) {
                      return `${winnerName} ${s.charAt(0).toLowerCase() + s.slice(1)}`;
                    }
                    return s;
                  })()}
                </p>
              )}
            </div>

            {match.playerOfMatch && (
              <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center sm:justify-end gap-1">
                  <Award className="w-3 h-3" /> Player of the Match
                </div>
                <div className="text-sm font-bold text-white">{match.playerOfMatch.name}</div>
                <div className="text-xs text-slate-400">{match.playerOfMatch.team}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* INNINGS TABS */}
      {inningsList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            {inningsList.map((inn: any, index: number) => (
              <button
                key={inn.id}
                onClick={() => setActiveInningsTab(index)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeInningsTab === index
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {inn.battingTeam.shortName} Innings ({inn.totalRuns}/{inn.wickets})
              </button>
            ))}
          </div>

          {currentTabInnings && (
            <div className="space-y-6">
              {/* BATTING SCORECARD */}
              <div className="cricket-card border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Batting Scorecard — {currentTabInnings.battingTeam.name}
                  </h2>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {currentTabInnings.totalRuns}/{currentTabInnings.wickets} ({currentTabInnings.overs} Ov)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800/80">
                      <tr>
                        <th className="py-2.5 px-4">Batter</th>
                        <th className="py-2.5 px-4">Dismissal</th>
                        <th className="py-2.5 px-4 text-right">R</th>
                        <th className="py-2.5 px-4 text-right">B</th>
                        <th className="py-2.5 px-4 text-right">4s</th>
                        <th className="py-2.5 px-4 text-right">6s</th>
                        <th className="py-2.5 px-4 text-right">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {currentTabInnings.batting.map((b: any) => (
                        <tr key={b.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">
                            {b.name} {!b.isOut && <span className="text-emerald-400">*</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {b.dismissal}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white score-digits">
                            {b.runs}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 score-digits">
                            {b.balls}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 score-digits">
                            {b.fours}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 score-digits">
                            {b.sixes}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300 font-mono">
                            {b.strikeRate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Extras & Totals Breakdown */}
                <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-slate-400">
                    <strong className="text-slate-200">Extras:</strong> {currentTabInnings.extras.total}{" "}
                    <span className="text-[11px] text-slate-500 font-mono">
                      (b {currentTabInnings.extras.byes}, lb {currentTabInnings.extras.legByes}, wd{" "}
                      {currentTabInnings.extras.wides}, nb {currentTabInnings.extras.noBalls}, p{" "}
                      {currentTabInnings.extras.penalties})
                    </span>
                  </div>
                  <div className="text-slate-200 font-mono">
                    <strong>Total:</strong> {currentTabInnings.totalRuns}/{currentTabInnings.wickets} (
                    {currentTabInnings.overs} ov, RR: {currentTabInnings.runRate})
                  </div>
                </div>

                {/* Did Not Bat List */}
                {currentTabInnings.didNotBat?.length > 0 && (
                  <div className="p-4 border-t border-slate-800/60 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 uppercase mr-2 text-[11px]">
                      Did Not Bat:
                    </span>
                    {currentTabInnings.didNotBat.map((p: any, i: number) => (
                      <span key={p.id}>
                        {p.name}
                        {i < currentTabInnings.didNotBat.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* FALL OF WICKETS */}
              {currentTabInnings.fallOfWickets?.length > 0 && (
                <div className="cricket-card p-4 border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Fall of Wickets
                  </h3>
                  <div className="flex flex-wrap gap-3 text-xs font-mono">
                    {currentTabInnings.fallOfWickets.map((fow: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg"
                      >
                        <span className="text-emerald-400 font-bold">
                          {fow.runs}-{fow.wicketNumber}
                        </span>{" "}
                        <span className="text-slate-400">
                          ({fow.batsmanName}, {fow.over} ov)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BOWLING SCORECARD */}
              <div className="cricket-card border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Bowling Figures — {currentTabInnings.bowlingTeam.name}
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800/80">
                      <tr>
                        <th className="py-2.5 px-4">Bowler</th>
                        <th className="py-2.5 px-4 text-right">O</th>
                        <th className="py-2.5 px-4 text-right">M</th>
                        <th className="py-2.5 px-4 text-right">R</th>
                        <th className="py-2.5 px-4 text-right">W</th>
                        <th className="py-2.5 px-4 text-right">ECON</th>
                        <th className="py-2.5 px-4 text-right">0s</th>
                        <th className="py-2.5 px-4 text-right">WD</th>
                        <th className="py-2.5 px-4 text-right">NB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {currentTabInnings.bowling.map((bw: any) => (
                        <tr key={bw.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">{bw.name}</td>
                          <td className="py-3 px-4 text-right text-slate-300 font-mono">
                            {bw.overs}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 score-digits">
                            {bw.maidens}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white score-digits">
                            {bw.runsConceded}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-400 score-digits">
                            {bw.wickets}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300 font-mono">
                            {bw.economy}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 score-digits">
                            {bw.dots}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 score-digits">
                            {bw.wides}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 score-digits">
                            {bw.noBalls}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
