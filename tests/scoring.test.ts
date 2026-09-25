import { reconstructInnings, formatOvers, calculateStrikeRate, calculateEconomy, calculateRunRate } from "../lib/scoring/engine";
import { undoLastBall } from "../lib/scoring/undo";
import { BallInput } from "../lib/scoring/types";

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failedTests++;
  }
}

function runTests() {
  console.log("\n🏏 RUNNING CRICKET SCORING ENGINE UNIT TESTS 🏏\n");

  const playerMap: Record<string, string> = {
    p1: "Rohit Sharma",
    p2: "Virat Kohli",
    p3: "Suryakumar Yadav",
    b1: "Pat Cummins",
    b2: "Mitchell Starc",
  };

  const baseConfig = {
    oversLimit: 20,
    totalWicketsLimit: 10,
    targetRuns: null,
  };

  // Test 1: Normal runs
  {
    const balls: BallInput[] = [
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 1, extraType: "NONE", extraRuns: 0 },
      { batsmanId: "p2", nonStrikerId: "p1", bowlerId: "b1", runsBat: 2, extraType: "NONE", extraRuns: 0 },
    ];
    const state = reconstructInnings(balls, baseConfig, playerMap, "p1", "p2", "b1");
    assert(state.totalRuns === 3, "Test 1.1: Total runs calculated correctly (1 + 2 = 3)");
    assert(state.legalBalls === 2, "Test 1.2: Legal balls counted correctly (2 balls)");
    assert(state.batsmen["p1"].runs === 1 && state.batsmen["p1"].balls === 1, "Test 1.3: Batsman 1 stats accurate");
    assert(state.batsmen["p2"].runs === 2 && state.batsmen["p2"].balls === 1, "Test 1.4: Batsman 2 stats accurate");
  }

  // Test 2: Boundaries (4s and 6s)
  {
    const balls: BallInput[] = [
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 4, extraType: "NONE", extraRuns: 0, isBoundary: true },
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 6, extraType: "NONE", extraRuns: 0, isSix: true },
    ];
    const state = reconstructInnings(balls, baseConfig, playerMap, "p1", "p2", "b1");
    assert(state.totalRuns === 10, "Test 2.1: Boundaries add 10 runs");
    assert(state.batsmen["p1"].fours === 1, "Test 2.2: Fours count incremented");
    assert(state.batsmen["p1"].sixes === 1, "Test 2.3: Sixes count incremented");
    assert(state.currentStrikerId === "p1", "Test 2.4: Even boundaries retain strike");
  }

  // Test 3: Wides (1 run, not legal ball, not faced by batsman)
  {
    const balls: BallInput[] = [
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 0, extraType: "WIDE", extraRuns: 1 },
    ];
    const state = reconstructInnings(balls, baseConfig, playerMap, "p1", "p2", "b1");
    assert(state.totalRuns === 1, "Test 3.1: Wide adds 1 run to total");
    assert(state.wides === 1, "Test 3.2: Wide extra counted");
    assert(state.legalBalls === 0, "Test 3.3: Wide does NOT count as legal ball");
    assert(state.batsmen["p1"].balls === 0, "Test 3.4: Wide is NOT counted as ball faced by batsman");
    assert(state.bowlers["b1"].runsConceded === 1, "Test 3.5: Wide is charged to bowler");
  }

  // Test 4: No-balls (extra run + bat runs, not legal ball)
  {
    const balls: BallInput[] = [
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 4, extraType: "NO_BALL", extraRuns: 1, isBoundary: true },
    ];
    const state = reconstructInnings(balls, baseConfig, playerMap, "p1", "p2", "b1");
    assert(state.totalRuns === 5, "Test 4.1: No-ball adds extra + boundary (1 + 4 = 5)");
    assert(state.noBalls === 1, "Test 4.2: No-ball extras recorded");
    assert(state.legalBalls === 0, "Test 4.3: No-ball is NOT a legal ball");
    assert(state.batsmen["p1"].runs === 4, "Test 4.4: Batsman credited with runs off bat");
    assert(state.bowlers["b1"].runsConceded === 5, "Test 4.5: Bowler charged with no-ball and runs");
  }

  // Test 5: Byes & Leg-byes (runs to team, legal ball, NOT charged to bowler)
  {
    const balls: BallInput[] = [
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 0, extraType: "BYE", extraRuns: 2 },
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 0, extraType: "LEG_BYE", extraRuns: 1 },
    ];
    const state = reconstructInnings(balls, baseConfig, playerMap, "p1", "p2", "b1");
    assert(state.totalRuns === 3, "Test 5.1: Total runs include byes and leg-byes");
    assert(state.byes === 2 && state.legByes === 1, "Test 5.2: Byes and leg-byes counted in extras");
    assert(state.bowlers["b1"].runsConceded === 0, "Test 5.3: Byes/Leg-byes are NOT charged to bowler");
    assert(state.legalBalls === 2, "Test 5.4: Byes and leg-byes count as legal balls");
  }

  // Test 6: Wickets (Bowled - bowler credited, batsman out)
  {
    const balls: BallInput[] = [
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 0, extraType: "NONE", extraRuns: 0, isWicket: true, wicketType: "BOWLED", newBatsmanId: "p3" },
    ];
    const state = reconstructInnings(balls, baseConfig, playerMap, "p1", "p2", "b1");
    assert(state.wickets === 1, "Test 6.1: Wicket counter incremented");
    assert(state.batsmen["p1"].isOut === true, "Test 6.2: Dismissed batsman is marked out");
    assert(state.bowlers["b1"].wickets === 1, "Test 6.3: Bowler credited with wicket");
    assert(state.currentStrikerId === "p3", "Test 6.4: New batsman takes strike");
  }

  // Test 7: Run-outs (Bowler NOT credited, runs completed counted)
  {
    const balls: BallInput[] = [
      {
        batsmanId: "p1",
        nonStrikerId: "p2",
        bowlerId: "b1",
        runsBat: 1,
        extraType: "NONE",
        extraRuns: 0,
        isWicket: true,
        wicketType: "RUN_OUT",
        dismissedPlayerId: "p2",
        runsCompleted: 1,
        newBatsmanId: "p3",
      },
    ];
    const state = reconstructInnings(balls, baseConfig, playerMap, "p1", "p2", "b1");
    assert(state.wickets === 1, "Test 7.1: Run-out increments wickets");
    assert(state.bowlers["b1"].wickets === 0, "Test 7.2: Bowler NOT credited with run-out wicket");
    assert(state.batsmen["p2"].isOut === true, "Test 7.3: Correct batsman marked out (non-striker)");
    assert(state.totalRuns === 1, "Test 7.4: Completed runs included in total");
  }

  // Test 8: Strike rotation on odd runs
  {
    const balls: BallInput[] = [
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 1, extraType: "NONE", extraRuns: 0 },
    ];
    const state = reconstructInnings(balls, baseConfig, playerMap, "p1", "p2", "b1");
    assert(state.currentStrikerId === "p2", "Test 8.1: Strike rotated to p2 after single");
    assert(state.currentNonStrikerId === "p1", "Test 8.2: p1 becomes non-striker");
  }

  // Test 9: Strike rotation on Over completion (6 legal balls)
  {
    const balls: BallInput[] = [];
    // 5 dot balls
    for (let i = 0; i < 5; i++) {
      balls.push({ batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 0, extraType: "NONE", extraRuns: 0 });
    }
    // 6th ball: dot ball -> over completes -> strike rotates!
    balls.push({ batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 0, extraType: "NONE", extraRuns: 0 });

    const state = reconstructInnings(balls, baseConfig, playerMap, "p1", "p2", "b1");
    assert(state.legalBalls === 6, "Test 9.1: Over has 6 legal balls");
    assert(state.oversString === "1.0", "Test 9.2: Formatted overs is 1.0");
    assert(state.currentStrikerId === "p2", "Test 9.3: Strike rotated at end of over");
    assert(state.overs[0].isMaiden === true, "Test 9.4: Maiden over recorded (0 runs in 6 legal balls)");
    assert(state.bowlers["b1"].maidens === 1, "Test 9.5: Bowler credited with maiden");
  }

  // Test 10: Innings completion (All Out)
  {
    const balls: BallInput[] = [];
    for (let i = 0; i < 10; i++) {
      balls.push({
        batsmanId: `p${i + 1}`,
        nonStrikerId: "p99",
        bowlerId: "b1",
        runsBat: 0,
        extraType: "NONE",
        extraRuns: 0,
        isWicket: true,
        wicketType: "BOWLED",
        newBatsmanId: `p${i + 2}`,
      });
    }
    const state = reconstructInnings(balls, baseConfig, playerMap, "p1", "p99", "b1");
    assert(state.wickets === 10, "Test 10.1: 10 wickets fallen");
    assert(state.isCompleted === true, "Test 10.2: Innings completed upon All Out");
    assert(state.completionReason === "All Out", "Test 10.3: Completion reason is All Out");
  }

  // Test 11: Target calculation & Chase completion in 2nd Innings
  {
    const chaseConfig = {
      oversLimit: 20,
      totalWicketsLimit: 10,
      targetRuns: 100, // Target is 100
    };
    const balls: BallInput[] = [
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 6, extraType: "NONE", extraRuns: 0, isSix: true },
    ];
    let state = reconstructInnings(balls, chaseConfig, playerMap, "p1", "p2", "b1");
    assert(state.runsNeeded === 94, "Test 11.1: Runs needed updated accurately (100 - 6 = 94)");
    assert(state.ballsRemaining === 119, "Test 11.2: Balls remaining calculated correctly");
    assert(!state.isCompleted, "Test 11.3: Innings not completed yet");

    // Add winning hit
    balls.push({ batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 95, extraType: "NONE", extraRuns: 0 });
    state = reconstructInnings(balls, chaseConfig, playerMap, "p1", "p2", "b1");
    assert(state.totalRuns === 101, "Test 11.4: Total runs 101 passes target 100");
    assert(state.isCompleted === true, "Test 11.5: Innings automatically completes on winning chase");
    assert(state.completionReason === "Target Reached", "Test 11.6: Reason is Target Reached");
  }

  // Test 12: Strike Rate and Economy calculations
  {
    const sr = calculateStrikeRate(45, 30);
    assert(sr === 150.0, "Test 12.1: Strike rate (45/30)*100 = 150.0");
    const econ = calculateEconomy(24, 24); // 4 overs = 24 balls
    assert(econ === 6.0, "Test 12.2: Economy 24 runs in 4.0 overs = 6.0");
  }

  // Test 13: Undo System restores previous state accurately
  {
    const balls: BallInput[] = [
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 4, extraType: "NONE", extraRuns: 0, isBoundary: true },
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 6, extraType: "NONE", extraRuns: 0, isSix: true },
    ];
    const initial = reconstructInnings(balls, baseConfig, playerMap, "p1", "p2", "b1");
    assert(initial.totalRuns === 10, "Test 13.1: Pre-undo total runs is 10");

    const undoResult = undoLastBall(balls, baseConfig, playerMap, "p1", "p2", "b1");
    assert(undoResult.remainingBalls.length === 1, "Test 13.2: 1 ball remaining after undo");
    assert(undoResult.restoredState.totalRuns === 4, "Test 13.3: Total runs reverted from 10 to 4");
    assert(undoResult.restoredState.batsmen["p1"].runs === 4, "Test 13.4: Batsman runs reverted to 4");
    assert(undoResult.restoredState.batsmen["p1"].sixes === 0, "Test 13.5: Six count reverted from 1 to 0");
  }

  // Test 14: Super Over logic (6-ball max, 2 wickets all-out)
  {
    const superOverConfig = {
      oversLimit: 1, // 1 over = 6 balls
      totalWicketsLimit: 2, // Standard cricket super over is 2 wickets max
      targetRuns: 15,
      isSuperOver: true,
    };
    const balls: BallInput[] = [
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 6, extraType: "NONE", extraRuns: 0, isSix: true },
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 4, extraType: "NONE", extraRuns: 0, isBoundary: true },
      { batsmanId: "p1", nonStrikerId: "p2", bowlerId: "b1", runsBat: 0, extraType: "NONE", extraRuns: 0, isWicket: true, wicketType: "BOWLED", newBatsmanId: "p3" },
      { batsmanId: "p3", nonStrikerId: "p2", bowlerId: "b1", runsBat: 0, extraType: "NONE", extraRuns: 0, isWicket: true, wicketType: "BOWLED" },
    ];
    const state = reconstructInnings(balls, superOverConfig, playerMap, "p1", "p2", "b1");
    assert(state.wickets === 2, "Test 14.1: 2 wickets in super over");
    assert(state.isCompleted === true, "Test 14.2: Super over terminates when 2 wickets fall");
    assert(state.completionReason === "All Out", "Test 14.3: Reason is All Out");
  }

  console.log(`\n========================================`);
  console.log(`Total Passed: ${passedTests}`);
  console.log(`Total Failed: ${failedTests}`);
  console.log(`========================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
