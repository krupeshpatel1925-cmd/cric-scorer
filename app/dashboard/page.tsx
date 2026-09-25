"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  PlayCircle,
  Calendar,
  Users,
  PlusCircle,
  TrendingUp,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [matchRes, teamRes] = await Promise.all([
          fetch("/api/matches"),
          fetch("/api/teams"),
        ]);
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setMatches(matchData.matches || []);
        }
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeams(teamData.teams || []);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const completedMatches = matches.filter((m) => m.status === "COMPLETED");
  const liveMatches = matches.filter((m) => m.status === "LIVE" || m.status === "SUPER_OVER");
  const upcomingMatches = matches.filter((m) => m.status === "UPCOMING");

  return (
    <div className="space-y-8">
      {/* Top Banner & Primary Action */}
      <div className="dashboard-hero-banner flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/40 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Scoring Command Center
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-300">
            Real-time cricket tracking, ball-by-ball scoring, and squad statistics.
          </p>
        </div>

        <Link
          href="/matches/create"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-5 py-3 rounded-xl shadow-neon transition-all hover:scale-105 active:scale-95 text-sm shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          Create Match
        </Link>
      </div>

      {/* Live Matches In-Progress Banner */}
      {liveMatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 live-blinker" />
            Active Live Matches
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map((m) => {
              const currentInn = m.innings[m.innings.length - 1];
              const overs = currentInn
                ? `${Math.floor(currentInn.legalBalls / 6)}.${currentInn.legalBalls % 6}`
                : "0.0";
              const teamA = m.teams[0]?.team;
              const teamB = m.teams[1]?.team;

              return (
                <div
                  key={m.id}
                  className="cricket-card p-5 border-emerald-500/40 shadow-neon bg-slate-900/90 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {m.tournament || "Match"} • {m.venue || "Venue"}
                    </span>
                    <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider live-blinker">
                      Live
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-lg font-black text-white">
                        {teamA?.name} <span className="text-slate-500 font-normal">vs</span>{" "}
                        {teamB?.name}
                      </div>
                      {currentInn && (
                        <div className="text-2xl font-black text-emerald-400 score-digits flex items-baseline gap-2">
                          {currentInn.totalRuns}/{currentInn.wickets}
                          <span className="text-xs font-semibold text-slate-400 font-mono">
                            ({overs} / {m.oversLimit} ov)
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/matches/${m.id}/live`}
                      className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-lg shadow-neon text-sm transition-transform active:scale-95"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Score Live
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aggregate Statistics Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="cricket-card p-5 border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Matches</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white score-digits">{matches.length}</div>
          <div className="text-[11px] text-slate-500">Recorded across all tournaments</div>
        </div>

        <div className="cricket-card p-5 border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Completed</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white score-digits">
            {completedMatches.length}
          </div>
          <div className="text-[11px] text-slate-500">Finished fixtures with results</div>
        </div>

        <div className="cricket-card p-5 border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Teams</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white score-digits">{teams.length}</div>
          <div className="text-[11px] text-slate-500">Registered clubs & nations</div>
        </div>

        <div className="cricket-card p-5 border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Upcoming</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white score-digits">
            {upcomingMatches.length}
          </div>
          <div className="text-[11px] text-slate-500">Scheduled fixtures</div>
        </div>
      </div>

      {/* Recent Matches & Quick Actions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" /> Recent Matches
          </h2>
          <Link
            href="/matches"
            className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            View All Matches <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading matches...</div>
        ) : matches.length === 0 ? (
          <div className="cricket-card p-8 text-center text-slate-400 space-y-3">
            <Trophy className="w-10 h-10 mx-auto text-slate-600" />
            <p>No matches recorded yet.</p>
            <Link
              href="/matches/create"
              className="inline-block bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg"
            >
              Start First Match
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.slice(0, 6).map((m) => {
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
                  className="cricket-card p-5 border-slate-800 cricket-card-hover flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                    <span className="font-medium truncate max-w-[180px]">
                      {m.tournament || m.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isLive
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Innings 1 Team Score */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-200">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: team1?.color || "#10b981" }}
                        />
                        <span className="truncate">{team1?.name || "Team 1"}</span>
                      </div>
                      <div className="font-mono text-sm font-bold text-white score-digits">
                        {inn1 ? `${inn1.totalRuns}/${inn1.wickets}` : "-"}
                      </div>
                    </div>

                    {/* Innings 2 Team Score */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-200">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: team2?.color || "#eab308" }}
                        />
                        <span className="truncate">{team2?.name || "Team 2"}</span>
                      </div>
                      <div className="font-mono text-sm font-bold text-white score-digits">
                        {inn2 ? `${inn2.totalRuns}/${inn2.wickets}` : "-"}
                      </div>
                    </div>
                  </div>

                  {/* Result or Live Status */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-semibold truncate max-w-[200px]">
                      {displayMargin || (isLive ? "In Progress..." : "Upcoming")}
                    </span>

                    <Link
                      href={isLive ? `/matches/${m.id}/live` : `/matches/${m.id}/scorecard`}
                      className="text-slate-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
                    >
                      {isLive ? "Score" : "Scorecard"} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
