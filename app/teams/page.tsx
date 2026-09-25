"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, Shield, ArrowRight, X } from "lucide-react";

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [color, setColor] = useState("#10b981");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [initializingDb, setInitializingDb] = useState(false);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), shortName: shortName.trim(), color }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setName("");
        setShortName("");
        setColor("#10b981");
        setModalError("");
        setModalOpen(false);
        fetchTeams();
      } else {
        setModalError(data.error || "Failed to create team");
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || "Network error occurred while creating team");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitDb = async () => {
    setInitializingDb(true);
    try {
      const res = await fetch("/api/setup-db");
      const data = await res.json();
      if (res.ok && data.success) {
        setModalError("");
        alert("Database tables initialized successfully! You can now click 'Create Team'.");
        fetchTeams();
      } else {
        setModalError(
          data.error || "Could not auto-initialize. Please run `npx prisma db push` in terminal."
        );
      }
    } catch (err: any) {
      setModalError(
        err?.message || "Failed to initialize database. Please run `npx prisma db push` in terminal."
      );
    } finally {
      setInitializingDb(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" /> Team Management
          </h1>
          <p className="text-xs text-slate-400">Manage club rosters, national squads, and playing squads</p>
        </div>

        <button
          onClick={() => {
            setModalError("");
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-neon transition-all"
        >
          <Plus className="w-4 h-4" /> Create Team
        </button>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="cricket-card p-8 text-center text-slate-400 space-y-3">
          <Shield className="w-10 h-10 mx-auto text-slate-600" />
          <p>No teams created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((t) => (
            <div
              key={t.id}
              className="cricket-card p-6 border-slate-800 cricket-card-hover flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md"
                  style={{ backgroundColor: t.color || "#10b981" }}
                >
                  {t.shortName}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t.name}</h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {t.playerCount} Registered Players
                  </span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-center">
                <div>
                  <div className="text-xs text-slate-500 uppercase">Played</div>
                  <div className="text-sm font-bold text-white score-digits">
                    {t.stats?.completedMatches || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Won</div>
                  <div className="text-sm font-bold text-emerald-400 score-digits">
                    {t.stats?.wins || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Win %</div>
                  <div className="text-sm font-bold text-amber-400 score-digits">
                    {t.stats?.winPct || "0.0"}%
                  </div>
                </div>
              </div>

              <Link
                href={`/teams/${t.id}`}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 py-2.5 rounded-lg transition-colors"
              >
                Manage Squad & Roster <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cricket-card p-6 border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Team</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-medium space-y-2">
                  <div>{modalError}</div>
                  {(modalError.includes("does not exist") || modalError.includes("table")) && (
                    <button
                      type="button"
                      disabled={initializingDb}
                      onClick={handleInitDb}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-neon transition-all flex items-center justify-center gap-1.5"
                    >
                      {initializingDb ? "Creating database tables..." : "⚡ 1-Click: Initialize Database Tables Now"}
                    </button>
                  )}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Short Code (3-4 Letters)
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Team Jersey Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-400">{color}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-neon"
                >
                  {submitting ? "Saving..." : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
