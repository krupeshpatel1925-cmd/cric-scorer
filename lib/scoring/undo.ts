import { BallInput, ProcessedInnings } from "./types";
import { reconstructInnings, InningsConfig } from "./engine";

export interface UndoResult {
  undoneBall: BallInput | null;
  remainingBalls: BallInput[];
  restoredState: ProcessedInnings;
}

export function undoLastBall(
  balls: BallInput[],
  config: InningsConfig,
  playerMap: Record<string, string>,
  initialStrikerId?: string,
  initialNonStrikerId?: string,
  initialBowlerId?: string
): UndoResult {
  if (balls.length === 0) {
    return {
      undoneBall: null,
      remainingBalls: [],
      restoredState: reconstructInnings(
        [],
        config,
        playerMap,
        initialStrikerId,
        initialNonStrikerId,
        initialBowlerId
      ),
    };
  }

  const remainingBalls = balls.slice(0, -1);
  const undoneBall = balls[balls.length - 1];

  const restoredState = reconstructInnings(
    remainingBalls,
    config,
    playerMap,
    initialStrikerId,
    initialNonStrikerId,
    initialBowlerId
  );

  return {
    undoneBall,
    remainingBalls,
    restoredState,
  };
}
