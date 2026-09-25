import {
  BallInput,
  ProcessedInnings,
  BatsmanStats,
  BowlerStats,
  OverSummary,
  FallOfWicket,
  PartnershipStats,
  ExtraType,
  WicketType,
} from "./types";

export function formatOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

export function calculateStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0.0;
  return Number(((runs / balls) * 100).toFixed(2));
}

export function calculateEconomy(runsConceded: number, legalBalls: number): number {
  if (legalBalls === 0) return 0.0;
  const overs = legalBalls / 6;
  return Number((runsConceded / overs).toFixed(2));
}

export function calculateRunRate(totalRuns: number, legalBalls: number): number {
  if (legalBalls === 0) return 0.0;
  const overs = legalBalls / 6;
  return Number((totalRuns / overs).toFixed(2));
}

export function calculateRequiredRunRate(runsNeeded: number, ballsRemaining: number): number {
  if (ballsRemaining <= 0) return runsNeeded > 0 ? 99.99 : 0.0;
  const oversRemaining = ballsRemaining / 6;
  return Number((runsNeeded / oversRemaining).toFixed(2));
}

export interface PlayerInfo {
  id: string;
  name: string;
}

export interface InningsConfig {
  oversLimit: number;
  totalWicketsLimit: number; // e.g. 10 (or players - 1)
  targetRuns?: number | null; // For 2nd innings
  isSuperOver?: boolean;
}

/**
 * Deterministically recalculates an entire innings from the list of raw balls and player metadata.
 */
export function reconstructInnings(
  balls: BallInput[],
  config: InningsConfig,
  playerMap: Record<string, string>, // playerId -> playerName
  initialStrikerId?: string,
  initialNonStrikerId?: string,
  initialBowlerId?: string
): ProcessedInnings {
  const batsmen: Record<string, BatsmanStats> = {};
  const bowlers: Record<string, BowlerStats> = {};
  const overs: OverSummary[] = [];
  const fallOfWickets: FallOfWicket[] = [];

  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;
  let wides = 0;
  let noBalls = 0;
  let byes = 0;
  let legByes = 0;
  let penalties = 0;

  let currentStrikerId = initialStrikerId;
  let currentNonStrikerId = initialNonStrikerId;
  let currentBowlerId = initialBowlerId;

  let currentPartnershipRuns = 0;
  let currentPartnershipBalls = 0;

  let isCompleted = false;
  let completionReason: string | undefined = undefined;

  // Helper to ensure batsman entry exists
  const getOrCreateBatsman = (id: string): BatsmanStats => {
    if (!batsmen[id]) {
      batsmen[id] = {
        playerId: id,
        name: playerMap[id] || "Unknown Player",
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0.0,
        isOut: false,
        battingOrder: Object.keys(batsmen).length + 1,
      };
    }
    return batsmen[id];
  };

  // Helper to ensure bowler entry exists
  const getOrCreateBowler = (id: string): BowlerStats => {
    if (!bowlers[id]) {
      bowlers[id] = {
        playerId: id,
        name: playerMap[id] || "Unknown Bowler",
        legalBalls: 0,
        oversString: "0.0",
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        economy: 0.0,
        dots: 0,
        wides: 0,
        noBalls: 0,
      };
    }
    return bowlers[id];
  };

  // Initialize opening batsmen if provided
  if (initialStrikerId) getOrCreateBatsman(initialStrikerId);
  if (initialNonStrikerId) getOrCreateBatsman(initialNonStrikerId);
  if (initialBowlerId) getOrCreateBowler(initialBowlerId);

  // Process each ball sequentially
  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];
    const isLegal = ball.extraType !== "WIDE" && ball.extraType !== "NO_BALL";
    const runsOffBat = ball.runsBat || 0;
    let extraRuns = ball.extraRuns || 0;

    // Minimum 1 extra run for Wide or No-Ball if not already specified
    if ((ball.extraType === "WIDE" || ball.extraType === "NO_BALL") && extraRuns === 0) {
      extraRuns = 1;
    }

    const ballTotalRuns = runsOffBat + extraRuns;
    totalRuns += ballTotalRuns;

    // Update extras breakdown
    if (ball.extraType === "WIDE") wides += extraRuns;
    else if (ball.extraType === "NO_BALL") noBalls += extraRuns;
    else if (ball.extraType === "BYE") byes += extraRuns;
    else if (ball.extraType === "LEG_BYE") legByes += extraRuns;
    else if (ball.extraType === "PENALTY") penalties += extraRuns;

    if (isLegal) {
      legalBalls++;
    }

    // Batsman stats update
    const batsman = getOrCreateBatsman(ball.batsmanId);
    if (ball.nonStrikerId) getOrCreateBatsman(ball.nonStrikerId);

    // Wides do NOT count as a ball faced by batsman. No-ball, byes, leg byes and normal balls do count.
    if (ball.extraType !== "WIDE") {
      batsman.balls++;
      currentPartnershipBalls++;
    }

    batsman.runs += runsOffBat;
    currentPartnershipRuns += ballTotalRuns;

    if (ball.isBoundary || runsOffBat === 4) batsman.fours++;
    if (ball.isSix || runsOffBat === 6) batsman.sixes++;
    batsman.strikeRate = calculateStrikeRate(batsman.runs, batsman.balls);

    // Bowler stats update
    const bowler = getOrCreateBowler(ball.bowlerId);
    if (isLegal) bowler.legalBalls++;

    // Runs charged to bowler: all runs off bat + wides + no balls (byes, leg byes, penalties not charged)
    let runsChargedToBowler = runsOffBat;
    if (ball.extraType === "WIDE" || ball.extraType === "NO_BALL") {
      runsChargedToBowler += extraRuns;
      if (ball.extraType === "WIDE") bowler.wides += extraRuns;
      if (ball.extraType === "NO_BALL") bowler.noBalls += extraRuns;
    }
    bowler.runsConceded += runsChargedToBowler;

    // Dot ball if legal ball and 0 runs scored off bat and no extras
    if (isLegal && ballTotalRuns === 0) {
      bowler.dots++;
    }

    bowler.oversString = formatOvers(bowler.legalBalls);
    bowler.economy = calculateEconomy(bowler.runsConceded, bowler.legalBalls);

    // Over summary management
    const currentOverIndex = Math.floor((legalBalls - (isLegal ? 1 : 0)) / 6);
    let overSummary = overs[currentOverIndex];
    if (!overSummary) {
      overSummary = {
        overNumber: currentOverIndex + 1,
        bowlerId: ball.bowlerId,
        bowlerName: playerMap[ball.bowlerId] || "Unknown Bowler",
        legalBalls: 0,
        totalBalls: 0,
        runsConceded: 0,
        wickets: 0,
        isMaiden: false,
        ballsDisplay: [],
      };
      overs.push(overSummary);
    }

    overSummary.totalBalls++;
    if (isLegal) overSummary.legalBalls++;
    overSummary.runsConceded += runsChargedToBowler;

    // Over ball display formatting
    let ballDisplayText = `${runsOffBat}`;
    if (ball.isWicket) {
      ballDisplayText = "W";
      if (runsOffBat > 0) ballDisplayText += `+${runsOffBat}`;
    } else if (ball.extraType === "WIDE") {
      ballDisplayText = extraRuns > 1 ? `${extraRuns}Wd` : "Wd";
    } else if (ball.extraType === "NO_BALL") {
      ballDisplayText = runsOffBat > 0 ? `${runsOffBat}Nb` : "Nb";
    } else if (ball.extraType === "BYE") {
      ballDisplayText = `${extraRuns}B`;
    } else if (ball.extraType === "LEG_BYE") {
      ballDisplayText = `${extraRuns}Lb`;
    }

    overSummary.ballsDisplay.push({
      ballIndex: i,
      legalNumber: isLegal ? overSummary.legalBalls : undefined,
      text: ballDisplayText,
      isWicket: !!ball.isWicket,
      isBoundary: !!ball.isBoundary || runsOffBat === 4,
      isSix: !!ball.isSix || runsOffBat === 6,
      runs: ballTotalRuns,
      extraType: ball.extraType,
    });

    // Check maiden over when 6th legal ball is bowled
    if (isLegal && overSummary.legalBalls === 6) {
      overSummary.isMaiden = overSummary.runsConceded === 0;
      if (overSummary.isMaiden) {
        bowler.maidens++;
      }
    }

    // Wicket handling
    if (ball.isWicket) {
      wickets++;
      overSummary.wickets++;

      const dismissedPlayerId = ball.dismissedPlayerId || ball.batsmanId;
      const dismissedBatsman = getOrCreateBatsman(dismissedPlayerId);
      dismissedBatsman.isOut = true;
      dismissedBatsman.dismissalType = ball.wicketType || "BOWLED";
      dismissedBatsman.bowlerName =
        ball.wicketType !== "RUN_OUT" ? playerMap[ball.bowlerId] : undefined;
      dismissedBatsman.fielderName = ball.fielderId ? playerMap[ball.fielderId] : undefined;

      // Bowler is credited with wicket EXCEPT for run outs, timed out, retired out/hurt
      if (
        ball.wicketType !== "RUN_OUT" &&
        ball.wicketType !== "RETIRED_HURT" &&
        ball.wicketType !== "RETIRED_OUT"
      ) {
        bowler.wickets++;
      }

      fallOfWickets.push({
        wicketNumber: wickets,
        teamRuns: totalRuns,
        overString: formatOvers(legalBalls),
        batsmanId: dismissedPlayerId,
        batsmanName: playerMap[dismissedPlayerId] || "Unknown",
      });

      // Reset partnership
      currentPartnershipRuns = 0;
      currentPartnershipBalls = 0;

      // Update striker/non-striker for new batsman
      if (ball.newBatsmanId) {
        getOrCreateBatsman(ball.newBatsmanId);
        if (dismissedPlayerId === ball.batsmanId) {
          currentStrikerId = ball.newBatsmanId;
          currentNonStrikerId = ball.nonStrikerId;
        } else {
          currentStrikerId = ball.batsmanId;
          currentNonStrikerId = ball.newBatsmanId;
        }
      }
    }

    // Strike Rotation logic:
    // Determine how many physical runs the batsmen ran
    let runsRan = runsOffBat;
    if (ball.extraType === "BYE" || ball.extraType === "LEG_BYE") {
      runsRan = extraRuns;
    } else if (ball.extraType === "WIDE") {
      // If wide, 1 run is automatic wide extra. Any extra run beyond 1 indicates running:
      runsRan = Math.max(0, extraRuns - 1);
    } else if (ball.extraType === "NO_BALL") {
      runsRan = runsOffBat;
    }

    // For run outs with completed runs
    if (ball.isWicket && ball.wicketType === "RUN_OUT" && ball.runsCompleted !== undefined) {
      runsRan = ball.runsCompleted;
    }

    // Odd runs completed swap ends
    let shouldSwapEnds = runsRan % 2 === 1;

    // Apply run-based swap if no wicket fell or if wicket was run out with new batsman set
    if (shouldSwapEnds) {
      const temp = currentStrikerId;
      currentStrikerId = currentNonStrikerId;
      currentNonStrikerId = temp;
    }

    // End of Over (6 legal balls) -> Swap strike for the new over!
    if (isLegal && legalBalls % 6 === 0) {
      const temp = currentStrikerId;
      currentStrikerId = currentNonStrikerId;
      currentNonStrikerId = temp;
      currentBowlerId = undefined; // Scorer needs to choose next bowler
    } else {
      currentBowlerId = ball.bowlerId;
    }

    // Check innings completion triggers
    // 1. All out (10 wickets or config limit)
    if (wickets >= config.totalWicketsLimit) {
      isCompleted = true;
      completionReason = "All Out";
      break;
    }

    // 2. Maximum overs reached
    if (legalBalls >= config.oversLimit * 6) {
      isCompleted = true;
      completionReason = "Overs Completed";
      break;
    }

    // 3. Target chased down (2nd innings)
    if (config.targetRuns && totalRuns >= config.targetRuns) {
      isCompleted = true;
      completionReason = "Target Reached";
      break;
    }
  }

  const currentRunRate = calculateRunRate(totalRuns, legalBalls);
  let requiredRunRate: number | undefined = undefined;
  let runsNeeded: number | undefined = undefined;
  let ballsRemaining: number | undefined = undefined;

  if (config.targetRuns) {
    runsNeeded = Math.max(0, config.targetRuns - totalRuns);
    const totalMatchBalls = config.oversLimit * 6;
    ballsRemaining = Math.max(0, totalMatchBalls - legalBalls);
    requiredRunRate = calculateRequiredRunRate(runsNeeded, ballsRemaining);
  }

  const totalExtras = wides + noBalls + byes + legByes + penalties;

  // Build current partnership
  let currentPartnership: PartnershipStats | undefined = undefined;
  if (currentStrikerId && currentNonStrikerId) {
    currentPartnership = {
      batsman1Id: currentStrikerId,
      batsman1Name: playerMap[currentStrikerId] || "Striker",
      batsman2Id: currentNonStrikerId,
      batsman2Name: playerMap[currentNonStrikerId] || "Non-Striker",
      runs: currentPartnershipRuns,
      balls: currentPartnershipBalls,
      isCurrent: true,
    };
  }

  return {
    totalRuns,
    wickets,
    legalBalls,
    oversString: formatOvers(legalBalls),
    currentRunRate,
    requiredRunRate,
    targetRuns: config.targetRuns || undefined,
    runsNeeded,
    ballsRemaining,
    wides,
    noBalls,
    byes,
    legByes,
    penalties,
    totalExtras,
    isCompleted,
    completionReason,
    currentStrikerId,
    currentNonStrikerId,
    currentBowlerId,
    batsmen,
    bowlers,
    overs,
    fallOfWickets,
    currentPartnership,
  };
}
