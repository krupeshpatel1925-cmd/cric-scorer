"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  Edit2,
  X,
  Shield,
  Award,
  CircleDot,
} from "lucide-react";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);

  // Player Form state
  const [playerName, setPlayerName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [role, setRole] = useState("BATSMAN");
  const [battingStyle, setBattingStyle] = useState("Right-hand bat");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTeam = async () => {
    try {
      setErrorMsg(null);
      const res = await fetch(`/api/teams/${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || "Team not found.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load team details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const openAddPlayer = () => {
    setEditingPlayer(null);
    setPlayerName("");
    setJerseyNumber("");
    setRole("BATSMAN");
    setBattingStyle("Right-hand bat");
    setBowlingStyle("");
    setPlayerModalOpen(true);
  };

  const openEditPlayer = (p: any) => {
    setEditingPlayer(p);
    setPlayerName(p.name);
    setJerseyNumber(p.jerseyNumber ? p.jerseyNumber.toString() : "");
    setRole(p.role);
    setBattingStyle(p.battingStyle || "Right-hand bat");
    setBowlingStyle(p.bowlingStyle || "");
    setPlayerModalOpen(true);
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = editingPlayer
        ? `/api/players/${editingPlayer.id}`
        : `/api/players`;
      const method = editingPlayer ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName,
          jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : null,
          role,
          battingStyle,
          bowlingStyle,
          teamId,
        }),
      });

      if (res.ok) {
        setPlayerModalOpen(false);
        fetchTeam();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to save player");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving the player.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm("Are you sure you want to remove this player?")) return;
    try {
      const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
      if (res.ok) fetchTeam();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-mono">Loading team squad...</div>;
  if (!team) {
    return (
      <div className="max-w-md mx-auto my-12 cricket-card p-8 border-slate-800 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">Team Not Found</h2>
        <p className="text-xs text-slate-400">
          {errorMsg || "The requested team details could not be found."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setLoading(true);
              fetchTeam();
            }}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/teams"
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold shadow-neon transition-all"
          >
            Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Team Header */}
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Teams
      </Link>

      <div className="cricket-card p-6 border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-lg"
            style={{ backgroundColor: team.color || "#10b981" }}
          >
            {team.shortName}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{team.name}</h1>
            <p className="text-xs text-slate-400 font-mono">
              Squad Code: {team.shortName} • {team.players?.length || 0} Registered Squad Members
            </p>
          </div>
        </div>

        <button
          onClick={openAddPlayer}
          className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-neon transition-all self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Add Player to Squad
        </button>
      </div>

      {/* Squad Table */}
      <div className="cricket-card border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Active Roster ({team.players?.length || 0})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800/80 uppercase font-mono">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Player Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 hidden sm:table-cell">Batting Style</th>
                <th className="py-3 px-4 hidden md:table-cell">Bowling Style</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {team.players?.map((player: any) => (
                <tr key={player.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">
                    {player.jerseyNumber || "-"}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {player.name}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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
                  </td>
                  <td className="py-3 px-4 text-slate-400 hidden sm:table-cell">
                    {player.battingStyle || "Right-hand bat"}
                  </td>
                  <td className="py-3 px-4 text-slate-400 hidden md:table-cell">
                    {player.bowlingStyle || "-"}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEditPlayer(player)}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title="Edit Player"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
                      title="Remove Player"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Player Modal */}
      {playerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cricket-card p-6 border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingPlayer ? "Edit Player" : "Add Player to Squad"}
              </h3>
              <button
                onClick={() => setPlayerModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Player Name
                </label>
                <input
                  type="text"
                  required
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Jersey #
                  </label>
                  <input
                    type="number"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="BATSMAN">Batsman</option>
                    <option value="BOWLER">Bowler</option>
                    <option value="ALL_ROUNDER">All-rounder</option>
                    <option value="WICKET_KEEPER">Wicketkeeper</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Batting Style
                </label>
                <select
                  value={battingStyle}
                  onChange={(e) => setBattingStyle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Right-hand bat">Right-hand bat</option>
                  <option value="Left-hand bat">Left-hand bat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Bowling Style
                </label>
                <input
                  type="text"
                  value={bowlingStyle}
                  onChange={(e) => setBowlingStyle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPlayerModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-neon"
                >
                  {submitting ? "Saving..." : editingPlayer ? "Update Player" : "Add to Squad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
