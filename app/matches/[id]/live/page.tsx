"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  ArrowLeftRight,
  UserCheck,
  Flag,
  FileText,
  AlertTriangle,
  Trophy,
  X,
  Check,
  Shield,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { formatOvers } from "@/lib/scoring/engine";
import { saveToOfflineQueue } from "@/lib/offline/storage";

export default function LiveScorerPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scoringBusy, setScoringBusy] = useState(false);

  // Modals
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [bowlerModalOpen, setBowlerModalOpen] = useState(false);
  const [superOverModalOpen, setSuperOverModalOpen] = useState(false);
  const [endInningsModalOpen, setEndInningsModalOpen] = useState(false);
  const [batsmenModalOpen, setBatsmenModalOpen] = useState(false);

  // Wicket Modal form state
  const [wicketType, setWicketType] = useState("BOWLED");
  const [dismissedPlayerId, setDismissedPlayerId] = useState("");
  const [fielderId, setFielderId] = useState("");
  const [runsCompleted, setRunsCompleted] = useState(0);
  const [newBatsmanId, setNewBatsmanId] = useState("");

  // Bowler selection state
  const [selectedBowlerId, setSelectedBowlerId] = useState("");

  // Innings 2 Openers Setup state
  const [inn2StrikerId, setInn2StrikerId] = useState("");
  const [inn2NonStrikerId, setInn2NonStrikerId] = useState("");
  const [inn2BowlerId, setInn2BowlerId] = useState("");

  // Active Batsmen Modal selection state
  const [activeStrikerSelection, setActiveStrikerSelection] = useState("");
  const [activeNonStrikerSelection, setActiveNonStrikerSelection] = useState("");

  // Super Over selection state
  const [soStrikerId, setSoStrikerId] = useState("");
  const [soNonStrikerId, setSoNonStrikerId] = useState("");
  const [soBowlerId, setSoBowlerId] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    try {
      setErrorMsg(null);
      const res = await fetch(`/api/matches/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setMatch(data.match);

        const currentInn = data.match.innings?.[data.match.innings?.length - 1];

        // Check if bowler needs to be picked (e.g. over just finished)
        if (
          currentInn &&
          !currentInn.isCompleted &&
          !currentInn.currentBowlerId &&
          currentInn.legalBalls > 0 &&
          currentInn.legalBalls % 6 === 0
        ) {
          setBowlerModalOpen(true);
        }

        // If Innings 1 is completed and match is in progress, prefill Innings 2 openers
        if (
          currentInn &&
          currentInn.isCompleted &&
          currentInn.inningsNumber === 1 &&
          data.match.status === "IN_PROGRESS"
        ) {
          const inn2BattingTeamId = currentInn.bowlingTeamId;
          const inn2BowlingTeamId = currentInn.battingTeamId;
          const inn2BattingXI = data.match.playingXI?.filter((px: any) => px.teamId === inn2BattingTeamId) || [];
          const inn2BowlingXI = data.match.playingXI?.filter((px: any) => px.teamId === inn2BowlingTeamId) || [];
          setInn2StrikerId((prev) => prev || inn2BattingXI[0]?.playerId || "");
          setInn2NonStrikerId((prev) => prev || inn2BattingXI[1]?.playerId || "");
          setInn2BowlerId((prev) => prev || inn2BowlingXI[0]?.playerId || "");
        }

        // Trigger confetti if match just finished
        if (data.match.status === "COMPLETED" && data.match.result) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "Match not found.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load match.");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  const currentInnings = match?.innings?.[match?.innings?.length - 1];
  const battingTeam = match?.teams?.find((t: any) => t.teamId === currentInnings?.battingTeamId)?.team;
  const bowlingTeam = match?.teams?.find((t: any) => t.teamId === currentInnings?.bowlingTeamId)?.team;

  // Active Batsmen
  const striker = currentInnings?.batsmen?.find(
    (b: any) => b.playerId === currentInnings?.currentStrikerId
  );
  const nonStriker = currentInnings?.batsmen?.find(
    (b: any) => b.playerId === currentInnings?.currentNonStrikerId
  );

  // Active Bowler
  const activeBowler = currentInnings?.bowlers?.find(
    (bw: any) => bw.playerId === currentInnings?.currentBowlerId
  );

  // Available Players for new batsman
  const battingPlayingXI = match?.playingXI?.filter(
    (px: any) => px.teamId === currentInnings?.battingTeamId
  );
  const alreadyBattedIds = new Set(
    currentInnings?.batsmen?.map((b: any) => b.playerId) || []
  );
  const availableNextBatsmen = battingPlayingXI?.filter(
    (px: any) => !alreadyBattedIds.has(px.playerId)
  );

  // Available Bowlers (cannot be current bowler if over just completed)
  const bowlingPlayingXI = match?.playingXI?.filter(
    (px: any) => px.teamId === currentInnings?.bowlingTeamId
  );

  // Current Over object and balls
  const currentOver = currentInnings?.overs?.[currentInnings?.overs?.length - 1];

  // Helper to record ball
  const recordBall = async (ballData: any) => {
    if (scoringBusy || currentInnings?.isCompleted) return;
    setScoringBusy(true);

    try {
      const res = await fetch(`/api/matches/${matchId}/ball`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ballData),
      });

      if (!res.ok) {
        // If offline, queue locally
        if (!navigator.onLine) {
          saveToOfflineQueue(matchId, {
            matchId,
            type: "BALL",
            payload: ballData,
          });
        } else {
          const err = await res.json().catch(() => ({}));
          setErrorMsg(err.error || "Failed to record ball");
        }
      }

      await fetchMatch();
    } catch (e: any) {
      if (!navigator.onLine) {
        saveToOfflineQueue(matchId, {
          matchId,
          type: "BALL",
          payload: ballData,
        });
      } else {
        setErrorMsg(e.message || "Failed to record ball.");
      }
    } finally {
      setScoringBusy(false);
    }
  };

  // Quick Runs Scoring
  const handleScoreRuns = (runs: number, isBoundary = false, isSix = false) => {
    recordBall({
      runsBat: runs,
      extraType: "NONE",
      extraRuns: 0,
      isBoundary,
      isSix,
    });
  };

  // Quick Extras Scoring
  const handleScoreExtra = (extraType: string, runs: number = 1) => {
    recordBall({
      runsBat: 0,
      extraType,
      extraRuns: runs,
    });
  };

  // Undo Last Ball
  const handleUndo = async () => {
    if (scoringBusy) return;
    setScoringBusy(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/undo`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || "Undo failed");
      }
      await fetchMatch();
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to undo ball.");
    } finally {
      setScoringBusy(false);
    }
  };

  // Manual Strike Switch
  const handleChangeStrike = async () => {
    try {
      await fetch(`/api/matches/${matchId}/change-strike`, { method: "POST" });
      await fetchMatch();
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Wicket Modal
  const handleWicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWicketModalOpen(false);

    recordBall({
      isWicket: true,
      wicketType,
      dismissedPlayerId: dismissedPlayerId || currentInnings?.currentStrikerId,
      fielderId: fielderId || null,
      runsCompleted,
      newBatsmanId: newBatsmanId || null,
      runsBat: runsCompleted,
      extraType: "NONE",
      extraRuns: 0,
    });
  };

  // Submit Bowler Change
  const handleBowlerChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBowlerId) return;

    try {
      await fetch(`/api/matches/${matchId}/change-bowler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bowlerId: selectedBowlerId }),
      });
      setBowlerModalOpen(false);
      await fetchMatch();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Open Conclude / Next Innings Modal
  const handleOpenEndInnings = () => {
    if (currentInnings?.inningsNumber === 1) {
      const inn2BattingTeamId = currentInnings.bowlingTeamId;
      const inn2BowlingTeamId = currentInnings.battingTeamId;
      const inn2BattingXI = match?.playingXI?.filter((px: any) => px.teamId === inn2BattingTeamId) || [];
      const inn2BowlingXI = match?.playingXI?.filter((px: any) => px.teamId === inn2BowlingTeamId) || [];
      if (!inn2StrikerId && inn2BattingXI[0]) setInn2StrikerId(inn2BattingXI[0].playerId);
      if (!inn2NonStrikerId && inn2BattingXI[1]) setInn2NonStrikerId(inn2BattingXI[1].playerId);
      if (!inn2BowlerId && inn2BowlingXI[0]) setInn2BowlerId(inn2BowlingXI[0].playerId);
    }
    setEndInningsModalOpen(true);
  };

  // Submit End Innings / Start Next Innings
  const handleEndInningsSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentInnings?.inningsNumber === 1) {
      if (!inn2StrikerId || !inn2NonStrikerId) {
        setErrorMsg("Please select both opening batsmen for the 2nd innings.");
        return;
      }
      if (inn2StrikerId === inn2NonStrikerId) {
        setErrorMsg("Striker and non-striker cannot be the same player.");
        return;
      }
      if (!inn2BowlerId) {
        setErrorMsg("Please select an opening bowler for the 2nd innings.");
        return;
      }
    }

    setScoringBusy(true);
    try {
      const payload = currentInnings?.inningsNumber === 1 ? {
        openingStrikerId: inn2StrikerId,
        openingNonStrikerId: inn2NonStrikerId,
        openingBowlerId: inn2BowlerId,
      } : {};

      const res = await fetch(`/api/matches/${matchId}/end-innings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || "Failed to conclude innings.");
      } else {
        setEndInningsModalOpen(false);
        await fetchMatch();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to conclude innings.");
    } finally {
      setScoringBusy(false);
    }
  };

  // Submit Active Batsmen Update
  const handleBatsmenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStrikerSelection || !activeNonStrikerSelection) {
      setErrorMsg("Please select both striker and non-striker.");
      return;
    }
    if (activeStrikerSelection === activeNonStrikerSelection) {
      setErrorMsg("Striker and non-striker cannot be the same player.");
      return;
    }

    setScoringBusy(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/change-batsmen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strikerId: activeStrikerSelection,
          nonStrikerId: activeNonStrikerSelection,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || "Failed to update batsmen.");
      } else {
        setBatsmenModalOpen(false);
        await fetchMatch();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to update batsmen.");
    } finally {
      setScoringBusy(false);
    }
  };

  // Handle Super Over Launch
  const handleSuperOverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const superOverBattingTeamId = currentInnings.bowlingTeamId;
      const superOverBowlingTeamId = currentInnings.battingTeamId;

      await fetch(`/api/matches/${matchId}/super-over`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          superOverBattingTeamId,
          superOverBowlingTeamId,
          openingStrikerId: soStrikerId,
          openingNonStrikerId: soNonStrikerId,
          openingBowlerId: soBowlerId,
        }),
      });

      setSuperOverModalOpen(false);
      await fetchMatch();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <div className="text-slate-400 font-mono text-sm">Loading live scoring engine...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-md mx-auto my-12 cricket-card p-8 border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Match Not Found</h2>
          <p className="text-xs text-slate-400 mt-1">
            {errorMsg || `The requested match (${matchId}) could not be located.`}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setLoading(true);
              fetchMatch();
            }}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
          <Link
            href="/matches"
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold shadow-neon transition-all"
          >
            Browse Matches
          </Link>
        </div>
      </div>
    );
  }

  if (!currentInnings) {
    return (
      <div className="max-w-md mx-auto my-12 cricket-card p-8 border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Innings Not Started</h2>
          <p className="text-xs text-slate-400 mt-1">
            Match &ldquo;{match.name}&rdquo; does not have an active innings yet.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href={`/matches/${matchId}/scorecard`}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            View Scorecard
          </Link>
          <Link
            href="/matches"
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold shadow-neon transition-all"
          >
            Return to Matches
          </Link>
        </div>
      </div>
    );
  }

  const oversString = formatOvers(currentInnings.legalBalls);
  const runRate =
    currentInnings.legalBalls > 0
      ? (currentInnings.totalRuns / (currentInnings.legalBalls / 6)).toFixed(2)
      : "0.00";

  let requiredRunRate = "0.00";
  let runsNeeded = 0;
  let ballsRemaining = 0;
  if (currentInnings.targetRuns) {
    runsNeeded = Math.max(0, currentInnings.targetRuns - currentInnings.totalRuns);
    const totalMaxBalls = match.oversLimit * 6;
    ballsRemaining = Math.max(0, totalMaxBalls - currentInnings.legalBalls);
    requiredRunRate =
      ballsRemaining > 0
        ? (runsNeeded / (ballsRemaining / 6)).toFixed(2)
        : runsNeeded > 0
        ? "99.9"
        : "0.00";
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          ← Exit Scorer
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/matches/${matchId}/scorecard`}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> Full Scorecard
          </Link>
          <button
            onClick={fetchMatch}
            title="Refresh Score"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${scoringBusy ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* In-App Error Notification Toast */}
      {errorMsg && (
        <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center justify-between text-xs text-red-200 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Innings 1 Concluded Banner */}
      {currentInnings?.isCompleted && currentInnings?.inningsNumber === 1 && match.status === "IN_PROGRESS" && (
        <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/50 p-6 rounded-2xl text-center space-y-3 shadow-neon">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Check className="w-3.5 h-3.5" /> Innings 1 Concluded
          </div>
          <h2 className="text-2xl font-black text-white">
            {battingTeam?.name} posted {currentInnings.totalRuns}/{currentInnings.wickets} ({oversString} ov)
          </h2>
          <p className="text-sm text-slate-300">
            Target for <strong className="text-amber-400">{bowlingTeam?.name}</strong>:{" "}
            <strong className="text-emerald-400 text-base">{currentInnings.totalRuns + 1} Runs</strong> from{" "}
            <strong>{match.oversLimit} Overs</strong> (Required Run Rate:{" "}
            <strong className="text-amber-300">
              {((currentInnings.totalRuns + 1) / match.oversLimit).toFixed(2)}
            </strong>)
          </p>
          <div className="pt-2">
            <button
              onClick={handleOpenEndInnings}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm px-6 py-3 rounded-xl shadow-neon transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              🏏 Setup &amp; Start 2nd Innings →
            </button>
          </div>
        </div>
      )}

      {/* Innings 2 Concluded Banner (Pending Finalization) */}
      {currentInnings?.isCompleted && currentInnings?.inningsNumber >= 2 && match.status === "IN_PROGRESS" && (
        <div className="bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 border border-blue-500/50 p-6 rounded-2xl text-center space-y-3 shadow-neon">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" /> Innings 2 Concluded
          </div>
          <h2 className="text-2xl font-black text-white">
            {battingTeam?.name}: {currentInnings.totalRuns}/{currentInnings.wickets} ({oversString} ov)
          </h2>
          <p className="text-xs text-slate-300">
            All overs completed or target reached. Conclude the match to generate the official scorecard &amp; result.
          </p>
          <div className="pt-2">
            <button
              onClick={handleOpenEndInnings}
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-black text-sm px-6 py-3 rounded-xl shadow-cardGlow transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              🏆 Conclude Match &amp; Finalize Result →
            </button>
          </div>
        </div>
      )}

      {/* Missing Batsmen Warning Banner */}
      {currentInnings && !currentInnings.isCompleted && (!currentInnings.currentStrikerId || !currentInnings.currentNonStrikerId) && (
        <div className="bg-amber-500/20 border border-amber-500/50 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-goldGlow">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs text-slate-200">
              <strong className="text-white">Active batsmen required:</strong> Select opening striker and non-striker to begin scoring.
            </div>
          </div>
          <button
            onClick={() => {
              const battingXI = match?.playingXI?.filter((px: any) => px.teamId === currentInnings.battingTeamId) || [];
              setActiveStrikerSelection(currentInnings.currentStrikerId || battingXI[0]?.playerId || "");
              setActiveNonStrikerSelection(currentInnings.currentNonStrikerId || battingXI[1]?.playerId || "");
              setBatsmenModalOpen(true);
            }}
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg shadow-goldGlow cursor-pointer"
          >
            Select Opening Batsmen
          </button>
        </div>
      )}

      {/* Match Result Banner if Completed */}
      {match.status === "COMPLETED" && match.result && (
        <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/50 p-6 rounded-2xl text-center space-y-2 shadow-neon">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-black text-white">{match.result.margin}</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">{match.result.summary}</p>
          <div className="pt-2">
            <Link
              href={`/matches/${matchId}/scorecard`}
              className="inline-block bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-neon"
            >
              View Complete Match Scorecard & Awards →
            </Link>
          </div>
        </div>
      )}

      {/* Tie Banner with Super Over Launch */}
      {match.status === "SUPER_OVER" && (
        <div className="bg-amber-500/20 border border-amber-500/50 p-6 rounded-2xl text-center space-y-3 shadow-goldGlow">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h2 className="text-xl font-black text-white">Match Tied — Super Over Activated!</h2>
          <p className="text-xs text-slate-300">Scores are level at the end of the second innings.</p>
          <button
            onClick={() => setSuperOverModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-goldGlow"
          >
            🏏 Select Super Over Batsmen & Bowler
          </button>
        </div>
      )}

      {/* STICKY SCORE HEADER */}
      <div className="sticky top-16 z-30 cricket-card p-4 sm:p-6 border-slate-800 shadow-cardGlow bg-slate-950/95 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Main Scoreboard */}
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 live-blinker" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Innings {currentInnings.inningsNumber} • {battingTeam?.name}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mt-1">
              <div className="text-4xl sm:text-5xl font-black text-white score-digits tracking-tight">
                {currentInnings.totalRuns}
                <span className="text-emerald-400">/{currentInnings.wickets}</span>
              </div>
              <div className="text-sm sm:text-base font-semibold text-slate-400 font-mono">
                ({oversString} / {match.oversLimit} ov)
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
              <span>
                CRR: <strong className="text-white">{runRate}</strong>
              </span>
              {currentInnings.targetRuns && (
                <>
                  <span>•</span>
                  <span>
                    Target: <strong className="text-amber-400">{currentInnings.targetRuns}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Need: <strong className="text-emerald-400">{runsNeeded}</strong> from{" "}
                    <strong className="text-white">{ballsRemaining}</strong> balls
                  </span>
                  <span>•</span>
                  <span>
                    RRR: <strong className="text-amber-300">{requiredRunRate}</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Extras and Over Quick Status */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs text-slate-400 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
            <div>
              Extras:{" "}
              <strong className="text-slate-200">
                {currentInnings.wides +
                  currentInnings.noBalls +
                  currentInnings.byes +
                  currentInnings.legByes +
                  currentInnings.penalties}
              </strong>{" "}
              <span className="text-[10px] text-slate-500 font-mono">
                (wd {currentInnings.wides}, nb {currentInnings.noBalls}, b {currentInnings.byes}, lb{" "}
                {currentInnings.legByes})
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              Bowler: <span className="text-emerald-400 font-bold">{activeBowler?.player?.name || "None Selected"}</span>
            </div>
          </div>
        </div>

        {/* OVER TIMELINE (Visual Ball Pills) */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
              Over {currentOver ? currentOver.overNumber : 1}
            </span>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              {currentOver?.balls?.map((b: any, idx: number) => {
                let badgeStyle = "bg-slate-900 text-slate-300 border-slate-800";
                let text = `${b.runsBat}`;

                if (b.isWicket) {
                  badgeStyle = "bg-red-500/20 text-red-400 border-red-500/50 font-black";
                  text = "W";
                } else if (b.runsBat === 4 || b.isBoundary) {
                  badgeStyle = "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold";
                  text = "4";
                } else if (b.runsBat === 6 || b.isSix) {
                  badgeStyle = "bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold";
                  text = "6";
                } else if (b.extraType === "WIDE") {
                  badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/50";
                  text = b.extraRuns > 1 ? `${b.extraRuns}Wd` : "Wd";
                } else if (b.extraType === "NO_BALL") {
                  badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/50";
                  text = b.runsBat > 0 ? `${b.runsBat}Nb` : "Nb";
                } else if (b.extraType === "BYE") {
                  badgeStyle = "bg-blue-500/20 text-blue-300 border-blue-500/50";
                  text = `${b.extraRuns}B`;
                } else if (b.extraType === "LEG_BYE") {
                  badgeStyle = "bg-blue-500/20 text-blue-300 border-blue-500/50";
                  text = `${b.extraRuns}Lb`;
                }

                return (
                  <span
                    key={idx}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border text-[11px] shadow-sm ${badgeStyle}`}
                  >
                    {text}
                  </span>
                );
              })}
              {(!currentOver || currentOver.balls?.length === 0) && (
                <span className="text-slate-600 text-xs italic">Start of over</span>
              )}
            </div>
          </div>

          <span className="text-[11px] text-slate-500 font-mono shrink-0">
            {currentOver?.legalBallsCount || 0}/6 balls
          </span>
        </div>
      </div>

      {/* ACTIVE PLAYERS SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Batsmen Card */}
        <div className="cricket-card p-4 border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-2">
            <span>Batsmen</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const battingXI = match?.playingXI?.filter((px: any) => px.teamId === currentInnings?.battingTeamId) || [];
                  setActiveStrikerSelection(currentInnings?.currentStrikerId || battingXI[0]?.playerId || "");
                  setActiveNonStrikerSelection(currentInnings?.currentNonStrikerId || battingXI[1]?.playerId || "");
                  setBatsmenModalOpen(true);
                }}
                className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 font-semibold uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800 transition-colors cursor-pointer"
              >
                <UserCheck className="w-3 h-3 text-emerald-400" /> Select Batsmen
              </button>
              <button
                onClick={handleChangeStrike}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-3 h-3" /> Swap Strike
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {/* Striker */}
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-white text-sm">
                  {striker?.player?.name || "Striker"} <span className="text-emerald-400">*</span>
                </span>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-white font-bold text-sm score-digits">
                  {striker?.runs || 0}
                </span>{" "}
                <span className="text-slate-400">({striker?.balls || 0})</span>{" "}
                <span className="text-slate-500 text-[10px]">
                  4s: {striker?.fours || 0} • 6s: {striker?.sixes || 0} • SR: {striker?.strikeRate || 0}
                </span>
              </div>
            </div>

            {/* Non-Striker */}
            <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span className="font-semibold text-slate-300 text-sm">
                  {nonStriker?.player?.name || "Non-Striker"}
                </span>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-slate-200 font-bold text-sm score-digits">
                  {nonStriker?.runs || 0}
                </span>{" "}
                <span className="text-slate-400">({nonStriker?.balls || 0})</span>{" "}
                <span className="text-slate-500 text-[10px]">
                  4s: {nonStriker?.fours || 0} • 6s: {nonStriker?.sixes || 0} • SR: {nonStriker?.strikeRate || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Bowler Card */}
        <div className="cricket-card p-4 border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-2">
            <span>Bowler</span>
            <button
              onClick={() => setBowlerModalOpen(true)}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
            >
              Change Bowler
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-sm">
                {activeBowler?.player?.name || "No Bowler Selected"}
              </div>
              <div className="text-xs text-slate-500">
                {bowlingTeam?.name}
              </div>
            </div>

            <div className="text-right font-mono text-xs">
              <div className="text-white font-bold score-digits">
                {activeBowler?.wickets || 0} / {activeBowler?.runsConceded || 0}
              </div>
              <div className="text-[10px] text-slate-400">
                {activeBowler ? formatOvers(activeBowler.legalBalls) : "0.0"} ov • Econ:{" "}
                {activeBowler?.economy || "0.0"} • M: {activeBowler?.maidens || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LARGE SCORING BUTTONS (ONE-TOUCH SCORING) */}
      <div className="cricket-card p-5 border-slate-800 space-y-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Scoring Pad
        </div>

        {/* Normal Runs Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
          {[0, 1, 2, 3, 4, 5, 6].map((num) => {
            const isFour = num === 4;
            const isSix = num === 6;

            return (
              <button
                key={num}
                type="button"
                disabled={scoringBusy || currentInnings.isCompleted}
                onClick={() => handleScoreRuns(num, isFour, isSix)}
                className={`scoring-btn h-14 sm:h-16 rounded-xl font-mono text-xl sm:text-2xl font-black shadow-md flex items-center justify-center disabled:opacity-40 ${
                  isFour
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-neon"
                    : isSix
                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-cardGlow"
                    : num === 0
                    ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Extras & Wicket Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            disabled={scoringBusy || currentInnings.isCompleted}
            onClick={() => handleScoreExtra("WIDE", 1)}
            className="scoring-btn py-3 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 disabled:opacity-40"
          >
            Wide (+1)
          </button>

          <button
            type="button"
            disabled={scoringBusy || currentInnings.isCompleted}
            onClick={() => handleScoreExtra("NO_BALL", 1)}
            className="scoring-btn py-3 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 disabled:opacity-40"
          >
            No Ball (+1)
          </button>

          <button
            type="button"
            disabled={scoringBusy || currentInnings.isCompleted}
            onClick={() => handleScoreExtra("BYE", 1)}
            className="scoring-btn py-3 rounded-lg text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 disabled:opacity-40"
          >
            Bye (+1)
          </button>

          <button
            type="button"
            disabled={scoringBusy || currentInnings.isCompleted}
            onClick={() => handleScoreExtra("LEG_BYE", 1)}
            className="scoring-btn py-3 rounded-lg text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 disabled:opacity-40"
          >
            Leg Bye (+1)
          </button>

          <button
            type="button"
            disabled={scoringBusy || currentInnings.isCompleted}
            onClick={() => handleScoreExtra("PENALTY", 5)}
            className="scoring-btn py-3 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 disabled:opacity-40"
          >
            Penalty (+5)
          </button>

          {/* WICKET BUTTON */}
          <button
            type="button"
            disabled={scoringBusy || currentInnings.isCompleted}
            onClick={() => {
              setDismissedPlayerId(currentInnings.currentStrikerId || "");
              setWicketModalOpen(true);
            }}
            className="scoring-btn py-3 rounded-lg text-xs font-black bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/30 uppercase tracking-wider disabled:opacity-40"
          >
            🚨 Wicket!
          </button>
        </div>

        {/* SCORING ACTION CONTROLS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={scoringBusy}
              onClick={handleUndo}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg border border-slate-800 transition-colors disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Undo Ball
            </button>

            <button
              type="button"
              onClick={handleChangeStrike}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg border border-slate-800 transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" /> Switch Strike
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenEndInnings}
            className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
              currentInnings?.isCompleted
                ? "text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 shadow-neon"
                : "text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border-red-500/30"
            }`}
          >
            {currentInnings?.inningsNumber === 1
              ? currentInnings?.isCompleted ? "🏏 Setup & Start 2nd Innings" : "End Current Innings"
              : currentInnings?.isCompleted ? "🏆 Conclude & Finalize Match" : "End Current Innings"}
          </button>
        </div>
      </div>

      {/* WICKET MODAL */}
      {wicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cricket-card p-6 border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span className="text-red-500">Wicket Dismissal</span>
              </h3>
              <button
                onClick={() => setWicketModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Dismissal Type
                </label>
                <select
                  value={wicketType}
                  onChange={(e) => setWicketType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="BOWLED">Bowled</option>
                  <option value="CAUGHT">Caught</option>
                  <option value="LBW">LBW (Leg Before Wicket)</option>
                  <option value="RUN_OUT">Run Out</option>
                  <option value="STUMPED">Stumped</option>
                  <option value="HIT_WICKET">Hit Wicket</option>
                  <option value="RETIRED_HURT">Retired Hurt</option>
                  <option value="RETIRED_OUT">Retired Out</option>
                </select>
              </div>

              {/* Dismissed Batsman (for run outs where striker or non-striker can be out) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Dismissed Batsman
                </label>
                <select
                  value={dismissedPlayerId}
                  onChange={(e) => setDismissedPlayerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={currentInnings.currentStrikerId || ""}>
                    {striker?.player?.name} (Striker)
                  </option>
                  <option value={currentInnings.currentNonStrikerId || ""}>
                    {nonStriker?.player?.name} (Non-Striker)
                  </option>
                </select>
              </div>

              {/* Fielder for Catches / Run Outs */}
              {(wicketType === "CAUGHT" || wicketType === "RUN_OUT" || wicketType === "STUMPED") && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Fielder / Keeper
                  </label>
                  <select
                    value={fielderId}
                    onChange={(e) => setFielderId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Fielder (Optional)</option>
                    {bowlingPlayingXI?.map((px: any) => (
                      <option key={px.playerId} value={px.playerId}>
                        {px.player.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Runs completed on Run Out */}
              {wicketType === "RUN_OUT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Runs Completed Before Run Out
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={runsCompleted}
                    onChange={(e) => setRunsCompleted(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* New Batsman Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Next Incoming Batsman
                </label>
                <select
                  value={newBatsmanId}
                  onChange={(e) => setNewBatsmanId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Incoming Batsman</option>
                  {availableNextBatsmen?.map((px: any) => (
                    <option key={px.playerId} value={px.playerId}>
                      {px.player.name} ({px.player.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWicketModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-md"
                >
                  Confirm Wicket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOWLER SELECTION MODAL (Triggered at End of Over or manually) */}
      {bowlerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cricket-card p-6 border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Select Bowler for Next Over
              </h3>
              <button
                onClick={() => setBowlerModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBowlerChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Choose Bowler ({bowlingTeam?.name})
                </label>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {bowlingPlayingXI?.map((px: any) => {
                    const isPreviousBowler = currentOver?.bowlerId === px.playerId;
                    const isSelected = selectedBowlerId === px.playerId;

                    return (
                      <div
                        key={px.playerId}
                        onClick={() => setSelectedBowlerId(px.playerId)}
                        className={`p-3 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{px.player.name}</div>
                          <div className="text-[10px] text-slate-500">{px.player.role}</div>
                        </div>
                        {isPreviousBowler && (
                          <span className="text-[10px] text-amber-400 font-mono">
                            Just Bowled
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBowlerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedBowlerId}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-neon disabled:opacity-50"
                >
                  Confirm Bowler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPER OVER MODAL */}
      {superOverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cricket-card p-6 border-amber-500/40 max-w-md w-full space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              ⚡ Configure Super Over
            </h3>
            <p className="text-xs text-slate-300">
              Select 2 batsmen and 1 bowler for the 1-over tie-breaker!
            </p>

            <form onSubmit={handleSuperOverSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Super Over Striker
                </label>
                <select
                  value={soStrikerId}
                  onChange={(e) => setSoStrikerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  required
                >
                  <option value="">Select Striker</option>
                  {bowlingPlayingXI?.map((px: any) => (
                    <option key={px.playerId} value={px.playerId}>
                      {px.player.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Super Over Non-Striker
                </label>
                <select
                  value={soNonStrikerId}
                  onChange={(e) => setSoNonStrikerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  required
                >
                  <option value="">Select Non-Striker</option>
                  {bowlingPlayingXI?.map((px: any) => (
                    <option key={px.playerId} value={px.playerId} disabled={px.playerId === soStrikerId}>
                      {px.player.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Opposition Bowler
                </label>
                <select
                  value={soBowlerId}
                  onChange={(e) => setSoBowlerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  required
                >
                  <option value="">Select Bowler</option>
                  {battingPlayingXI?.map((px: any) => (
                    <option key={px.playerId} value={px.playerId}>
                      {px.player.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-lg text-sm shadow-goldGlow"
              >
                Start Super Over Scoring!
              </button>
            </form>
          </div>
        </div>
      )}

      {/* END INNINGS 1 / START INNINGS 2 MODAL */}
      {endInningsModalOpen && currentInnings?.inningsNumber === 1 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cricket-card p-6 border-emerald-500/40 max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200 shadow-cardGlow">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <h3 className="text-lg font-black text-white">
                  Conclude Innings 1 &amp; Setup Innings 2
                </h3>
              </div>
              <button
                onClick={() => setEndInningsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Innings 1 Recap Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs uppercase font-mono font-bold text-slate-400">
                1st Innings Summary
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-white text-base">{battingTeam?.name}</span>
                <span className="font-mono font-black text-xl text-emerald-400">
                  {currentInnings.totalRuns}/{currentInnings.wickets}{" "}
                  <span className="text-xs text-slate-400">({oversString} ov)</span>
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>
                  Target for <strong className="text-amber-400">{bowlingTeam?.name}</strong>:
                </span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  {currentInnings.totalRuns + 1} runs from {match.oversLimit} overs
                </span>
              </div>
            </div>

            <form onSubmit={handleEndInningsSubmit} className="space-y-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select 2nd Innings Openers ({bowlingTeam?.name})
              </div>

              {/* Striker */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Opening Striker ({bowlingTeam?.name}) *
                </label>
                <select
                  value={inn2StrikerId}
                  onChange={(e) => setInn2StrikerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Opening Striker</option>
                  {bowlingPlayingXI?.map((px: any) => (
                    <option key={px.playerId} value={px.playerId}>
                      {px.player.name} ({px.player.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Non-Striker */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Opening Non-Striker ({bowlingTeam?.name}) *
                </label>
                <select
                  value={inn2NonStrikerId}
                  onChange={(e) => setInn2NonStrikerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Opening Non-Striker</option>
                  {bowlingPlayingXI?.map((px: any) => (
                    <option
                      key={px.playerId}
                      value={px.playerId}
                      disabled={px.playerId === inn2StrikerId}
                    >
                      {px.player.name} ({px.player.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Opening Bowler */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Opening Bowler ({battingTeam?.name}) *
                </label>
                <select
                  value={inn2BowlerId}
                  onChange={(e) => setInn2BowlerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Opening Bowler</option>
                  {battingPlayingXI?.map((px: any) => (
                    <option key={px.playerId} value={px.playerId}>
                      {px.player.name} ({px.player.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEndInningsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scoringBusy || !inn2StrikerId || !inn2NonStrikerId || !inn2BowlerId || inn2StrikerId === inn2NonStrikerId}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-neon disabled:opacity-40 transition-all cursor-pointer"
                >
                  {scoringBusy ? "Starting 2nd Innings..." : "Start 2nd Innings →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* END INNINGS 2 / FINALIZE MATCH MODAL */}
      {endInningsModalOpen && currentInnings?.inningsNumber >= 2 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cricket-card p-6 border-amber-500/40 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 shadow-cardGlow">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Conclude Match
              </h3>
              <button
                onClick={() => setEndInningsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to conclude this innings and finalize the match result?
            </p>

            <div className="bg-slate-900 p-4 rounded-xl space-y-2 text-xs border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">{battingTeam?.name}:</span>
                <span className="font-bold text-white font-mono">
                  {currentInnings.totalRuns}/{currentInnings.wickets} ({oversString} ov)
                </span>
              </div>
              {currentInnings.targetRuns && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Target:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {currentInnings.targetRuns} runs
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEndInningsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={scoringBusy}
                onClick={() => handleEndInningsSubmit()}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-lg shadow-goldGlow transition-all cursor-pointer"
              >
                {scoringBusy ? "Finalizing..." : "Confirm & Conclude Match"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELECT / CHANGE ACTIVE BATSMEN MODAL */}
      {batsmenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cricket-card p-6 border-slate-800 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 shadow-cardGlow">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" /> Select Active Batsmen ({battingTeam?.name})
              </h3>
              <button
                onClick={() => setBatsmenModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatsmenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Striker Batsman *
                </label>
                <select
                  value={activeStrikerSelection}
                  onChange={(e) => setActiveStrikerSelection(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Striker</option>
                  {battingPlayingXI?.map((px: any) => (
                    <option key={px.playerId} value={px.playerId}>
                      {px.player.name} ({px.player.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Non-Striker Batsman *
                </label>
                <select
                  value={activeNonStrikerSelection}
                  onChange={(e) => setActiveNonStrikerSelection(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Non-Striker</option>
                  {battingPlayingXI?.map((px: any) => (
                    <option
                      key={px.playerId}
                      value={px.playerId}
                      disabled={px.playerId === activeStrikerSelection}
                    >
                      {px.player.name} ({px.player.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBatsmenModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scoringBusy || !activeStrikerSelection || !activeNonStrikerSelection || activeStrikerSelection === activeNonStrikerSelection}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-neon disabled:opacity-50 cursor-pointer"
                >
                  {scoringBusy ? "Saving..." : "Confirm Batsmen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
