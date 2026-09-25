"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, Search, Filter } from "lucide-react";

export default function PlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, tRes] = await Promise.all([
          fetch("/api/players"),
          fetch("/api/teams"),
        ]);
        if (pRes.ok) {
          const pData = await pRes.json();
          setPlayers(pData.players || []);
        }
        if (tRes.ok) {
          const tData = await tRes.json();
          setTeams(tData.teams || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredPlayers = players.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = !selectedTeam || p.teamId === selectedTeam;
    const matchesRole = !selectedRole || p.role === selectedRole;
    return matchesSearch && matchesTeam && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-emerald-400" /> Player Directory
        </h1>
        <p className="text-xs text-slate-400">Search and view players across all clubs and teams</p>
      </div>

      {/* Filters & Search */}
      <div className="cricket-card p-4 border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by player name..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Roles</option>
            <option value="BATSMAN">Batsman</option>
            <option value="BOWLER">Bowler</option>
            <option value="ALL_ROUNDER">All-Rounder</option>
            <option value="WICKET_KEEPER">Wicketkeeper</option>
          </select>
        </div>
      </div>

      {/* Players Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">Loading players...</div>
      ) : filteredPlayers.length === 0 ? (
        <div className="cricket-card p-8 text-center text-slate-400 space-y-2">
          <UserCheck className="w-8 h-8 mx-auto text-slate-600" />
          <p>No players found matching the filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="cricket-card p-4 border-slate-800 cricket-card-hover space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{player.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: player.team?.color || "#10b981" }}
                    />
                    {player.team?.name}
                  </div>
                </div>
                {player.jerseyNumber && (
                  <span className="font-mono text-xs font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    #{player.jerseyNumber}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                    player.role === "BATSMAN"
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      : player.role === "BOWLER"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : player.role === "ALL_ROUNDER"
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {player.role.replace("_", " ")}
                </span>
                <span className="text-slate-400 truncate max-w-[120px]">
                  {player.battingStyle}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
