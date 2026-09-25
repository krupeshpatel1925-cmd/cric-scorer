export type Role = "BATSMAN" | "BOWLER" | "ALL_ROUNDER" | "WICKET_KEEPER";
export type MatchFormat = "T20" | "ODI" | "TEST" | "CUSTOM";
export type BallType = "LEATHER" | "TENNIS";
export type MatchStatus = "UPCOMING" | "LIVE" | "COMPLETED" | "ABANDONED" | "SUPER_OVER";
export type TossDecision = "BAT" | "BOWL";

export type ExtraType = "NONE" | "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE" | "PENALTY";

export type WicketType =
  | "BOWLED"
  | "CAUGHT"
  | "LBW"
  | "RUN_OUT"
  | "STUMPED"
  | "HIT_WICKET"
  | "RETIRED_HURT"
  | "RETIRED_OUT";

export interface BallInput {
  batsmanId: string;
  nonStrikerId: string;
  bowlerId: string;
  runsBat: number;
  extraType: ExtraType;
  extraRuns: number; // e.g. 1 for wide, 1 for no-ball, or extra runs run on bye
  isBoundary?: boolean;
  isSix?: boolean;
  isWicket?: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  fielderId?: string;
  runsCompleted?: number; // for run-outs
  newBatsmanId?: string; // when wicket falls
  comment?: string;
}

export interface BatsmanStats {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalType?: string;
  bowlerName?: string;
  fielderName?: string;
  battingOrder: number;
}

export interface BowlerStats {
  playerId: string;
  name: string;
  legalBalls: number;
  oversString: string; // e.g. "3.2"
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  dots: number;
  wides: number;
  noBalls: number;
}

export interface OverSummary {
  overNumber: number; // 1-indexed
  bowlerId: string;
  bowlerName: string;
  legalBalls: number;
  totalBalls: number;
  runsConceded: number;
  wickets: number;
  isMaiden: boolean;
  ballsDisplay: Array<{
    ballIndex: number;
    legalNumber?: number;
    text: string;
    isWicket: boolean;
    isBoundary: boolean;
    isSix: boolean;
    runs: number;
    extraType: ExtraType;
  }>;
}

export interface FallOfWicket {
  wicketNumber: number;
  teamRuns: number;
  overString: string;
  batsmanId: string;
  batsmanName: string;
}

export interface PartnershipStats {
  batsman1Id: string;
  batsman1Name: string;
  batsman2Id: string;
  batsman2Name: string;
  runs: number;
  balls: number;
  isCurrent: boolean;
}

export interface ProcessedInnings {
  totalRuns: number;
  wickets: number;
  legalBalls: number;
  oversString: string;
  currentRunRate: number;
  requiredRunRate?: number;
  targetRuns?: number;
  runsNeeded?: number;
  ballsRemaining?: number;
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalties: number;
  totalExtras: number;
  isCompleted: boolean;
  completionReason?: string;
  currentStrikerId?: string;
  currentNonStrikerId?: string;
  currentBowlerId?: string;
  batsmen: Record<string, BatsmanStats>;
  bowlers: Record<string, BowlerStats>;
  overs: OverSummary[];
  fallOfWickets: FallOfWicket[];
  currentPartnership?: PartnershipStats;
}
