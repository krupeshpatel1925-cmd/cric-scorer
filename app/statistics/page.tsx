"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Trophy,
  Flame,
  Award,
  TrendingUp,
  Shield,
  Search,
} from "lucide-react";

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<"batting" | "bowling" | "teams">("batting");
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const [pRes, tRes] = await Promise.all([
          fetch("/api/statistics/players"),
          fetch("/api/statistics/teams"),
        ]);
        if (pRes.ok) {
          const pData = await pRes.json();
          setPlayers(pData.players || []);
        }
        if (tRes.ok) {
          const tData = await tRes.json();
          setTeams(tData.teams || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Filtered players
  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.teamName.toLowerCase().includes(search.toLowerCase())
  );

  // Leaderboard Highlights
  const topRunScorer = [...players].sort((a, b) => b.batting.runs - a.batting.runs)[0];
  const topWicketTaker = [...players].sort((a, b) => b.bowling.wickets - a.bowling.wickets)[0];
  const topTeam = teams[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" /> Statistics & Leaderboards
        </h1>
        <p className="text-xs text-slate-400">
          Career records, batting strike rates, bowling economies, and team win ratios
        </p>
      </div>

      {/* TOP PERFORMERS PODIUM CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topRunScorer && (
          <div className="cricket-card p-5 border-slate-800 space-y-3 bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Orange Cap Leader
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Most Runs</span>
            </div>
            <div>
              <div className="text-lg font-black text-white">{topRunScorer.name}</div>
              <div className="text-xs text-slate-400">{topRunScorer.teamName}</div>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
              <div className="text-2xl font-black text-amber-400 score-digits">
                {topRunScorer.batting.runs} <span className="text-xs text-slate-400 font-normal">runs</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                SR: {topRunScorer.batting.strikeRate} • Avg: {topRunScorer.batting.average}
              </div>
            </div>
          </div>
        )}

        {topWicketTaker && (
          <div className="cricket-card p-5 border-slate-800 space-y-3 bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Purple Cap Leader
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Most Wickets</span>
            </div>
            <div>
              <div className="text-lg font-black text-white">{topWicketTaker.name}</div>
              <div className="text-xs text-slate-400">{topWicketTaker.teamName}</div>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
              <div className="text-2xl font-black text-purple-400 score-digits">
                {topWicketTaker.bowling.wickets} <span className="text-xs text-slate-400 font-normal">wkts</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Econ: {topWicketTaker.bowling.economy} • {topWicketTaker.bowling.overs} ov
              </div>
            </div>
          </div>
        )}

        {topTeam && (
          <div className="cricket-card p-5 border-slate-800 space-y-3 bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> Top Ranked Team
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Win Percentage</span>
            </div>
            <div>
              <div className="text-lg font-black text-white">{topTeam.name}</div>
              <div className="text-xs text-slate-400">
                {topTeam.wins} Wins / {topTeam.matches} Matches
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
              <div className="text-2xl font-black text-emerald-400 score-digits">
                {topTeam.winPercentage}%
              </div>
              <div className="text-xs text-slate-400 font-mono">
                High: {topTeam.highestScore}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("batting")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "batting"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-neon"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            🏏 Batting Statistics
          </button>

          <button
            onClick={() => setActiveTab("bowling")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "bowling"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-neon"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            ⚾ Bowling Statistics
          </button>

          <button
            onClick={() => setActiveTab("teams")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "teams"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-neon"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            🏆 Team Standings
          </button>
        </div>

        {activeTab !== "teams" && (
          <div className="relative w-48 hidden sm:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* BATTING TABLE */}
      {activeTab === "batting" && (
        <div className="cricket-card border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 text-right">Inn</th>
                  <th className="py-3 px-4 text-right">Runs</th>
                  <th className="py-3 px-4 text-right">Avg</th>
                  <th className="py-3 px-4 text-right">SR</th>
                  <th className="py-3 px-4 text-right">HS</th>
                  <th className="py-3 px-4 text-right">50s</th>
                  <th className="py-3 px-4 text-right">100s</th>
                  <th className="py-3 px-4 text-right">4s</th>
                  <th className="py-3 px-4 text-right">6s</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredPlayers
                  .filter((p) => p.batting.innings > 0)
                  .sort((a, b) => b.batting.runs - a.batting.runs)
                  .map((player) => (
                    <tr key={player.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{player.name}</td>
                      <td className="py-3 px-4 text-slate-400">{player.teamName}</td>
                      <td className="py-3 px-4 text-right text-slate-400 score-digits">
                        {player.batting.innings}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400 score-digits">
                        {player.batting.runs}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300 font-mono">
                        {player.batting.average}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300 font-mono">
                        {player.batting.strikeRate}
                      </td>
                      <td className="py-3 px-4 text-right text-white score-digits font-semibold">
                        {player.batting.highestScore}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 score-digits">
                        {player.batting.fifties}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 score-digits">
                        {player.batting.hundreds}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 score-digits">
                        {player.batting.fours}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 score-digits">
                        {player.batting.sixes}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BOWLING TABLE */}
      {activeTab === "bowling" && (
        <div className="cricket-card border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-4">Bowler</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 text-right">Inn</th>
                  <th className="py-3 px-4 text-right">Overs</th>
                  <th className="py-3 px-4 text-right">Runs</th>
                  <th className="py-3 px-4 text-right">Wkts</th>
                  <th className="py-3 px-4 text-right">Econ</th>
                  <th className="py-3 px-4 text-right">Avg</th>
                  <th className="py-3 px-4 text-right">Best</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredPlayers
                  .filter((p) => p.bowling.innings > 0)
                  .sort((a, b) => b.bowling.wickets - a.bowling.wickets)
                  .map((player) => (
                    <tr key={player.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{player.name}</td>
                      <td className="py-3 px-4 text-slate-400">{player.teamName}</td>
                      <td className="py-3 px-4 text-right text-slate-400 score-digits">
                        {player.bowling.innings}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300 font-mono">
                        {player.bowling.overs}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 score-digits">
                        {player.bowling.runsConceded}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-purple-400 score-digits">
                        {player.bowling.wickets}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300 font-mono">
                        {player.bowling.economy}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300 font-mono">
                        {player.bowling.average}
                      </td>
                      <td className="py-3 px-4 text-right text-white score-digits font-semibold">
                        {player.bowling.bestBowlingWickets} wkts
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEAM STANDINGS */}
      {activeTab === "teams" && (
        <div className="cricket-card border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 text-right">Played</th>
                  <th className="py-3 px-4 text-right">Won</th>
                  <th className="py-3 px-4 text-right">Lost</th>
                  <th className="py-3 px-4 text-right">Ties</th>
                  <th className="py-3 px-4 text-right">Win %</th>
                  <th className="py-3 px-4 text-right">High Score</th>
                  <th className="py-3 px-4 text-right">Low Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.color || "#10b981" }}
                      />
                      {team.name} ({team.shortName})
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300 score-digits font-semibold">
                      {team.matches}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 score-digits">
                      {team.wins}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 score-digits">
                      {team.losses}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 score-digits">
                      {team.ties}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400 score-digits">
                      {team.winPercentage}%
                    </td>
                    <td className="py-3 px-4 text-right text-white score-digits font-semibold">
                      {team.highestScore}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 score-digits">
                      {team.lowestScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
