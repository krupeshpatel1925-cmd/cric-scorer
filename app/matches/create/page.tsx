"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  CheckCircle2,
  Users,
  Coin,
  Play,
  Flame,
  Shield,
  CircleDot,
} from "lucide-react";

export default function CreateMatchPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [step, setStep] = useState(1); // 1: Teams & Metadata, 2: Squad / Playing XI, 3: Toss & Openers

  // Step 1: Match metadata
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split("T")[0]);
  const [oversLimit, setOversLimit] = useState("20");
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");

  // Squad details
  const [teamAPlayers, setTeamAPlayers] = useState<any[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<any[]>([]);
  const [teamAPlayingXI, setTeamAPlayingXI] = useState<string[]>([]);
  const [teamBPlayingXI, setTeamBPlayingXI] = useState<string[]>([]);
  const [teamACaptainId, setTeamACaptainId] = useState("");
  const [teamAWicketkeeperId, setTeamAWicketkeeperId] = useState("");
  const [teamBCaptainId, setTeamBCaptainId] = useState("");
  const [teamBWicketkeeperId, setTeamBWicketkeeperId] = useState("");

  // Step 3: Toss & Openers
  const [tossWinnerId, setTossWinnerId] = useState("");
  const [tossDecision, setTossDecision] = useState<"BAT" | "BOWL">("BAT");
  const [openingStrikerId, setOpeningStrikerId] = useState("");
  const [openingNonStrikerId, setOpeningNonStrikerId] = useState("");
  const [openingBowlerId, setOpeningBowlerId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data = await res.json();
          setTeams(data.teams || []);
          if (data.teams?.length >= 2) {
            setTeamAId(data.teams[0].id);
            setTeamBId(data.teams[1].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTeams(false);
      }
    }
    loadTeams();
  }, []);

  // When teams are selected, fetch their full squads
  useEffect(() => {
    async function loadSquads() {
      if (teamAId) {
        const resA = await fetch(`/api/teams/${teamAId}`);
        if (resA.ok) {
          const dataA = await resA.json();
          const players = dataA.team.players || [];
          setTeamAPlayers(players);
          // Auto select first 11
          const first11 = players.slice(0, 11).map((p: any) => p.id);
          setTeamAPlayingXI(first11);
          if (players.length > 0) {
            setTeamACaptainId(players[0].id);
            setTeamAWicketkeeperId(players.find((p: any) => p.role === "WICKET_KEEPER")?.id || players[0].id);
          }
        }
      }

      if (teamBId) {
        const resB = await fetch(`/api/teams/${teamBId}`);
        if (resB.ok) {
          const dataB = await resB.json();
          const players = dataB.team.players || [];
          setTeamBPlayers(players);
          const first11 = players.slice(0, 11).map((p: any) => p.id);
          setTeamBPlayingXI(first11);
          if (players.length > 0) {
            setTeamBCaptainId(players[0].id);
            setTeamBWicketkeeperId(players.find((p: any) => p.role === "WICKET_KEEPER")?.id || players[0].id);
          }
        }
      }
    }
    loadSquads();
  }, [teamAId, teamBId]);

  const teamA = teams.find((t) => t.id === teamAId);
  const teamB = teams.find((t) => t.id === teamBId);

  // Determine batting and bowling teams based on toss
  const battingTeamId =
    tossWinnerId === teamAId
      ? tossDecision === "BAT" ? teamAId : teamBId
      : tossDecision === "BAT" ? teamBId : teamAId;
  const bowlingTeamId = battingTeamId === teamAId ? teamBId : teamAId;

  const battingSquad = battingTeamId === teamAId ? teamAPlayingXI : teamBPlayingXI;
  const bowlingSquad = bowlingTeamId === teamAId ? teamAPlayingXI : teamBPlayingXI;

  const battingPlayers = (battingTeamId === teamAId ? teamAPlayers : teamBPlayers).filter((p) =>
    battingSquad.includes(p.id)
  );
  const bowlingPlayers = (bowlingTeamId === teamAId ? teamAPlayers : teamBPlayers).filter((p) =>
    bowlingSquad.includes(p.id)
  );

  // Auto-fill openers when entering step 3
  const handleProceedToToss = () => {
    if (!tossWinnerId) setTossWinnerId(teamAId);
    setStep(3);
  };

  useEffect(() => {
    if (battingPlayers.length >= 2) {
      if (!openingStrikerId || !battingPlayers.some((p) => p.id === openingStrikerId)) {
        setOpeningStrikerId(battingPlayers[0].id);
      }
      if (!openingNonStrikerId || !battingPlayers.some((p) => p.id === openingNonStrikerId)) {
        setOpeningNonStrikerId(battingPlayers[1].id);
      }
    }
    if (bowlingPlayers.length >= 1) {
      if (!openingBowlerId || !bowlingPlayers.some((p) => p.id === openingBowlerId)) {
        const primaryBowler = bowlingPlayers.find((p) => p.role === "BOWLER") || bowlingPlayers[0];
        setOpeningBowlerId(primaryBowler.id);
      }
    }
  }, [tossWinnerId, tossDecision, step]);

  const togglePlayerXI = (playerId: string, team: "A" | "B") => {
    if (team === "A") {
      setTeamAPlayingXI((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
      );
    } else {
      setTeamBPlayingXI((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
      );
    }
  };

  const handleLaunchMatch = async () => {
    if (openingStrikerId === openingNonStrikerId) {
      alert("Striker and Non-Striker must be different players!");
      return;
    }

    setSubmitting(true);

    try {
      const format = oversLimit === "20" ? "T20" : oversLimit === "50" ? "ODI" : "CUSTOM";
      const matchPayload = {
        name: `${teamA?.name || "Team A"} vs ${teamB?.name || "Team B"}`,
        tournament: null,
        venue: null,
        matchDate,
        format,
        oversLimit,
        ballType: "LEATHER",
        teamAId,
        teamBId,
        teamACaptainId,
        teamAWicketkeeperId,
        teamBCaptainId,
        teamBWicketkeeperId,
        teamAPlayingXI,
        teamBPlayingXI,
        tossWinnerId,
        tossDecision,
        openingStrikerId,
        openingNonStrikerId,
        openingBowlerId,
      };

      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchPayload),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to create match");
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      router.push(`/matches/${data.match.id}/live`);
    } catch (err) {
      console.error(err);
      alert("Error occurred while creating match.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      {/* Stepper Header */}
      <div className="cricket-card p-6 border-slate-800 space-y-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-400" /> Match Setup Wizard
          </h1>
          <p className="text-xs text-slate-400">Configure teams, match rules, squad rosters, and toss</p>
        </div>

        {/* Wizard Step Indicator */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div
            className={`flex items-center gap-2 text-xs font-bold ${
              step >= 1 ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${
                step >= 1 ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              1
            </span>
            Match Settings
          </div>
          <div className="w-12 h-0.5 bg-slate-800" />
          <div
            className={`flex items-center gap-2 text-xs font-bold ${
              step >= 2 ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${
                step >= 2 ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              2
            </span>
            Playing XI Squads
          </div>
          <div className="w-12 h-0.5 bg-slate-800" />
          <div
            className={`flex items-center gap-2 text-xs font-bold ${
              step >= 3 ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${
                step >= 3 ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              3
            </span>
            Toss & Openers
          </div>
        </div>
      </div>

      {/* STEP 1: Teams & Metadata */}
      {step === 1 && (
        <div className="cricket-card p-6 border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Step 1: Match Rules & Teams</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Team A (Home)
              </label>
              <select
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.id === teamBId}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Team B (Away)
              </label>
              <select
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.id === teamAId}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Match Date
              </label>
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Overs Limit
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={oversLimit}
                onChange={(e) => setOversLimit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-6 py-3 rounded-lg shadow-neon"
            >
              Continue to Playing XI →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Playing XI Squad Selection */}
      {step === 2 && (
        <div className="cricket-card p-6 border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Step 2: Select Playing XI</h2>
            <div className="text-xs text-slate-400">Select 11 players for each team</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team A Squad */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{teamA?.name} Squad</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {teamAPlayingXI.length} Selected
                </span>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {teamAPlayers.map((p) => {
                  const selected = teamAPlayingXI.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePlayerXI(p.id, "A")}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        selected
                          ? "cricket-selection-active"
                          : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <span className="font-medium">
                        #{p.jerseyNumber || "-"} {p.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {p.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team B Squad */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{teamB?.name} Squad</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {teamBPlayingXI.length} Selected
                </span>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {teamBPlayers.map((p) => {
                  const selected = teamBPlayingXI.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePlayerXI(p.id, "B")}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        selected
                          ? "cricket-selection-active"
                          : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <span className="font-medium">
                        #{p.jerseyNumber || "-"} {p.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {p.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-white px-4 py-2"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleProceedToToss}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-6 py-3 rounded-lg shadow-neon"
            >
              Continue to Toss & Openers →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Toss Winner, Decision & Opening Batters/Bowlers */}
      {step === 3 && (
        <div className="cricket-card p-6 border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Step 3: Toss & Match Start</h2>

          {/* Toss Selection */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="text-xs font-bold text-slate-300 uppercase">Toss Winner</div>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTossWinnerId(teamAId)}
                className={`p-4 rounded-xl border font-bold text-sm transition-all ${
                  tossWinnerId === teamAId
                    ? "cricket-selection-active shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {teamA?.name}
              </button>

              <button
                type="button"
                onClick={() => setTossWinnerId(teamBId)}
                className={`p-4 rounded-xl border font-bold text-sm transition-all ${
                  tossWinnerId === teamBId
                    ? "cricket-selection-active shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {teamB?.name}
              </button>
            </div>

            <div className="text-xs font-bold text-slate-300 uppercase pt-2">Elected to</div>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTossDecision("BAT")}
                className={`p-3 rounded-xl border font-bold text-xs transition-all ${
                  tossDecision === "BAT"
                    ? "cricket-selection-amber-active shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                🏏 Bat First
              </button>

              <button
                type="button"
                onClick={() => setTossDecision("BOWL")}
                className={`p-3 rounded-xl border font-bold text-xs transition-all ${
                  tossDecision === "BOWL"
                    ? "cricket-selection-amber-active shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                ⚾ Bowl First
              </button>
            </div>
          </div>

          {/* Openers Selector */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase">
              Opening Lineup: {battingTeamId === teamAId ? teamA?.name : teamB?.name} Batting
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Striker (Opening Batsman 1)
                </label>
                <select
                  value={openingStrikerId}
                  onChange={(e) => setOpeningStrikerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {battingPlayers.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === openingNonStrikerId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Non-Striker (Opening Batsman 2)
                </label>
                <select
                  value={openingNonStrikerId}
                  onChange={(e) => setOpeningNonStrikerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {battingPlayers.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === openingStrikerId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Opening Bowler ({bowlingTeamId === teamAId ? teamA?.name : teamB?.name})
                </label>
                <select
                  value={openingBowlerId}
                  onChange={(e) => setOpeningBowlerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {bowlingPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-slate-400 hover:text-white px-4 py-2"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleLaunchMatch}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm px-8 py-3.5 rounded-xl shadow-neon flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-white" />
              {submitting ? "Launching..." : "Start Scoring Live!"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
