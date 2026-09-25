"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Search,
  Filter,
  Trash2,
  PlayCircle,
  FileText,
  Calendar,
  PlusCircle,
  ArrowUpDown,
} from "lucide-react";

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");

  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this match record?")) return;
    try {
      const res = await fetch(`/api/matches/${id}`, { method: "DELETE" });
      if (res.ok) fetchMatches();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredMatches = matches.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.tournament && m.tournament.toLowerCase().includes(search.toLowerCase())) ||
      (m.venue && m.venue.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || m.status === statusFilter;
    const matchesFormat = !formatFilter || m.format === formatFilter;
    return matchesSearch && matchesStatus && matchesFormat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-400" /> Match History & Archives
          </h1>
          <p className="text-xs text-slate-400">
            Browse complete ball-by-ball scorecards, tournament logs, and live matches
          </p>
        </div>

        <Link
          href="/matches/create"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-neon transition-all"
        >
          <PlusCircle className="w-4 h-4" /> Create Match
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="cricket-card p-4 border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by match, tournament or venue..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="LIVE">Live Now</option>
            <option value="COMPLETED">Completed</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="SUPER_OVER">Super Over</option>
          </select>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Formats</option>
            <option value="T20">T20</option>
            <option value="ODI">ODI</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
      </div>

      {/* Match Cards List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono">Loading matches...</div>
      ) : filteredMatches.length === 0 ? (
        <div className="cricket-card p-8 text-center text-slate-400 space-y-3">
          <Trophy className="w-8 h-8 mx-auto text-slate-600" />
          <p>No matches found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((m) => {
            const inn1 = m.innings?.find((i: any) => i.inningsNumber === 1);
            const inn2 = m.innings?.find((i: any) => i.inningsNumber === 2);

            // Pair teams by batting innings order so scores are never swapped!
            const team1 = inn1
              ? (inn1.battingTeam || m.teams?.find((t: any) => t.teamId === inn1.battingTeamId)?.team)
              : m.teams?.[0]?.team;
            const team2 = inn2
              ? (inn2.battingTeam || m.teams?.find((t: any) => t.teamId === inn2.battingTeamId)?.team)
              : m.teams?.find((t: any) => (t.team?.id || t.teamId) !== (team1?.id || team1?.teamId))?.team || m.teams?.[1]?.team;

            const isLive = m.status === "LIVE" || m.status === "SUPER_OVER";

            let displayMargin = m.result?.margin;
            const winnerName =
              m.result?.winner?.name ||
              m.teams?.find(
                (t: any) => (t.team?.id || t.teamId) === m.result?.winnerId
              )?.team?.name;
            if (
              displayMargin &&
              winnerName &&
              !displayMargin.toLowerCase().includes(winnerName.toLowerCase())
            ) {
              displayMargin = `${winnerName} ${displayMargin.charAt(0).toLowerCase() + displayMargin.slice(1)}`;
            }

            return (
              <div
                key={m.id}
                className="cricket-card p-5 border-slate-800 cricket-card-hover flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Match Info & Teams */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        isLive
                          ? "bg-red-500/20 text-red-400 border border-red-500/40 live-blinker"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {m.status}
                    </span>
                    <span className="font-semibold text-white">{m.tournament || m.name}</span>
                    <span>•</span>
                    <span>{m.venue || "Stadium"}</span>
                    <span>•</span>
                    <span className="font-mono">{new Date(m.matchDate).toLocaleDateString()}</span>
                  </div>

                  {/* Scores Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                    <div className="flex items-center justify-between cricket-score-pill px-3.5 py-2.5 rounded-xl">
                      <div className="flex items-center gap-2 font-bold text-sm text-white">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: team1?.color || "#10b981" }}
                        />
                        <span className="truncate">{team1?.name || "Team 1"}</span>
                      </div>
                      <div className="font-mono text-sm font-bold text-white score-digits">
                        {inn1 ? `${inn1.totalRuns}/${inn1.wickets}` : "-"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between cricket-score-pill px-3.5 py-2.5 rounded-xl">
                      <div className="flex items-center gap-2 font-bold text-sm text-white">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: team2?.color || "#eab308" }}
                        />
                        <span className="truncate">{team2?.name || "Team 2"}</span>
                      </div>
                      <div className="font-mono text-sm font-bold text-white score-digits">
                        {inn2 ? `${inn2.totalRuns}/${inn2.wickets}` : "-"}
                      </div>
                    </div>
                  </div>

                  {/* Result Margin */}
                  {displayMargin && (
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" /> {displayMargin}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0 shrink-0">
                  {isLive ? (
                    <Link
                      href={`/matches/${m.id}/live`}
                      className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-neon transition-all"
                    >
                      <PlayCircle className="w-4 h-4" /> Score Live
                    </Link>
                  ) : (
                    <Link
                      href={`/matches/${m.id}/scorecard`}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" /> Scorecard
                    </Link>
                  )}

                  <button
                    onClick={() => handleDeleteMatch(m.id)}
                    className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
                    title="Delete Match"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
