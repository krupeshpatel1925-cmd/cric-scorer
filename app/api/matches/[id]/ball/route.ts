import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatOvers, calculateStrikeRate, calculateEconomy } from "@/lib/scoring/engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: matchId } = await params;
    const body = await req.json();
    const {
      runsBat = 0,
      extraType = "NONE",
      extraRuns = 0,
      isBoundary = false,
      isSix = false,
      isWicket = false,
      wicketType,
      dismissedPlayerId,
      fielderId,
      runsCompleted = 0,
      newBatsmanId,
      comment,
    } = body;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        innings: {
          orderBy: { inningsNumber: "desc" },
          take: 1,
        },
        teams: {
          include: { team: true },
        },
        playingXI: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const currentInnings = match.innings[0];
    if (!currentInnings) {
      return NextResponse.json({ error: "No active innings found" }, { status: 400 });
    }

    if (currentInnings.isCompleted) {
      return NextResponse.json(
        { error: "Current innings is already completed." },
        { status: 400 }
      );
    }

    let strikerId = currentInnings.currentStrikerId;
    let nonStrikerId = currentInnings.currentNonStrikerId;
    let bowlerId = currentInnings.currentBowlerId;

    if (!strikerId || !nonStrikerId) {
      return NextResponse.json(
        { error: "Both batsmen must be selected before scoring." },
        { status: 400 }
      );
    }

    if (!bowlerId) {
      return NextResponse.json(
        { error: "Bowler must be selected before scoring." },
        { status: 400 }
      );
    }

    // Calculations for this ball
    const isLegal = extraType !== "WIDE" && extraType !== "NO_BALL";
    let effectiveExtraRuns = extraRuns;
    if ((extraType === "WIDE" || extraType === "NO_BALL") && effectiveExtraRuns === 0) {
      effectiveExtraRuns = 1;
    }
    const ballTotalRuns = runsBat + effectiveExtraRuns;

    // Execute atomic transaction for ball scoring
    const result = await prisma.$transaction(async (tx) => {
      // Find or create current Over
      let currentOver = await tx.over.findFirst({
        where: {
          inningsId: currentInnings.id,
          legalBallsCount: { lt: 6 },
        },
        orderBy: { overNumber: "desc" },
      });

      if (!currentOver) {
        const lastOver = await tx.over.findFirst({
          where: { inningsId: currentInnings.id },
          orderBy: { overNumber: "desc" },
        });
        const nextOverNumber = lastOver ? lastOver.overNumber + 1 : 1;

        currentOver = await tx.over.create({
          data: {
            inningsId: currentInnings.id,
            overNumber: nextOverNumber,
            bowlerId,
          },
        });
      }

      // Count total balls in this innings for global index
      const ballIndex = await tx.ball.count({
        where: { inningsId: currentInnings.id },
      });

      const nextLegalNumberInOver = isLegal ? currentOver.legalBallsCount + 1 : null;

      // Create Ball record
      const createdBall = await tx.ball.create({
        data: {
          inningsId: currentInnings.id,
          overId: currentOver.id,
          ballIndex,
          legalBallNumber: nextLegalNumberInOver,
          batsmanId: strikerId!,
          nonStrikerId: nonStrikerId!,
          bowlerId,
          runsBat,
          extraType,
          extraRuns: effectiveExtraRuns,
          isLegal,
          isBoundary: isBoundary || runsBat === 4,
          isSix: isSix || runsBat === 6,
          isWicket,
          wicketType: isWicket ? wicketType : null,
          dismissedPlayerId: isWicket ? dismissedPlayerId || strikerId : null,
          fielderId: isWicket ? fielderId : null,
          comment,
        },
      });

      // Update Over stats
      let runsChargedToBowler = runsBat;
      if (extraType === "WIDE" || extraType === "NO_BALL") {
        runsChargedToBowler += effectiveExtraRuns;
      }

      const updatedOver = await tx.over.update({
        where: { id: currentOver.id },
        data: {
          legalBallsCount: isLegal ? { increment: 1 } : undefined,
          totalBallsCount: { increment: 1 },
          runsConceded: { increment: runsChargedToBowler },
          wicketsCount: isWicket ? { increment: 1 } : undefined,
          isMaiden: isLegal && currentOver.legalBallsCount + 1 === 6 && currentOver.runsConceded + runsChargedToBowler === 0,
        },
      });

      // Update Striker Batsman stats
      let strikerStats = await tx.batsmanInnings.findUnique({
        where: {
          inningsId_playerId: {
            inningsId: currentInnings.id,
            playerId: strikerId!,
          },
        },
      });

      if (!strikerStats) {
        const order = (await tx.batsmanInnings.count({ where: { inningsId: currentInnings.id } })) + 1;
        strikerStats = await tx.batsmanInnings.create({
          data: {
            inningsId: currentInnings.id,
            playerId: strikerId!,
            battingOrder: order,
          },
        });
      }

      const newBatsmanRuns = strikerStats.runs + runsBat;
      const newBatsmanBalls = extraType !== "WIDE" ? strikerStats.balls + 1 : strikerStats.balls;
      const newFours = runsBat === 4 || isBoundary ? strikerStats.fours + 1 : strikerStats.fours;
      const newSixes = runsBat === 6 || isSix ? strikerStats.sixes + 1 : strikerStats.sixes;
      const newSR = calculateStrikeRate(newBatsmanRuns, newBatsmanBalls);

      await tx.batsmanInnings.update({
        where: { id: strikerStats.id },
        data: {
          runs: newBatsmanRuns,
          balls: newBatsmanBalls,
          fours: newFours,
          sixes: newSixes,
          strikeRate: newSR,
        },
      });

      // Update Bowler stats
      let bowlerStats = await tx.bowlerInnings.findUnique({
        where: {
          inningsId_playerId: {
            inningsId: currentInnings.id,
            playerId: bowlerId,
          },
        },
      });

      if (!bowlerStats) {
        bowlerStats = await tx.bowlerInnings.create({
          data: {
            inningsId: currentInnings.id,
            playerId: bowlerId,
          },
        });
      }

      const newBowlerLegalBalls = isLegal ? bowlerStats.legalBalls + 1 : bowlerStats.legalBalls;
      const newBowlerRunsConceded = bowlerStats.runsConceded + runsChargedToBowler;
      const isBowlerCreditedWicket =
        isWicket &&
        wicketType !== "RUN_OUT" &&
        wicketType !== "RETIRED_HURT" &&
        wicketType !== "RETIRED_OUT";
      const newBowlerWickets = isBowlerCreditedWicket ? bowlerStats.wickets + 1 : bowlerStats.wickets;
      const newBowlerDots = isLegal && ballTotalRuns === 0 ? bowlerStats.dots + 1 : bowlerStats.dots;
      const newBowlerWides = extraType === "WIDE" ? bowlerStats.wides + effectiveExtraRuns : bowlerStats.wides;
      const newBowlerNoBalls = extraType === "NO_BALL" ? bowlerStats.noBalls + effectiveExtraRuns : bowlerStats.noBalls;
      const newBowlerEcon = calculateEconomy(newBowlerRunsConceded, newBowlerLegalBalls);
      const newBowlerMaidens = updatedOver.isMaiden ? bowlerStats.maidens + 1 : bowlerStats.maidens;

      await tx.bowlerInnings.update({
        where: { id: bowlerStats.id },
        data: {
          legalBalls: newBowlerLegalBalls,
          overs: parseFloat(formatOvers(newBowlerLegalBalls)),
          runsConceded: newBowlerRunsConceded,
          wickets: newBowlerWickets,
          dots: newBowlerDots,
          wides: newBowlerWides,
          noBalls: newBowlerNoBalls,
          economy: newBowlerEcon,
          maidens: newBowlerMaidens,
        },
      });

      // Handle Wicket Record if applicable
      if (isWicket) {
        const outPlayerId = dismissedPlayerId || strikerId!;
        const outBatsman = await tx.batsmanInnings.findUnique({
          where: {
            inningsId_playerId: {
              inningsId: currentInnings.id,
              playerId: outPlayerId,
            },
          },
        });

        if (outBatsman) {
          await tx.batsmanInnings.update({
            where: { id: outBatsman.id },
            data: {
              isOut: true,
              dismissalType: wicketType || "BOWLED",
              bowlerId: isBowlerCreditedWicket ? bowlerId : null,
              fielderId: fielderId || null,
            },
          });
        }

        await tx.wicket.create({
          data: {
            ballId: createdBall.id,
            batsmanId: outPlayerId,
            bowlerId: isBowlerCreditedWicket ? bowlerId : null,
            fielderId: fielderId || null,
            type: wicketType || "BOWLED",
            runsCompleted,
            wicketNumber: currentInnings.wickets + 1,
            teamRuns: currentInnings.totalRuns + ballTotalRuns,
            overNumber: parseFloat(formatOvers(currentInnings.legalBalls + (isLegal ? 1 : 0))),
          },
        });

        // If new batsman is selected, create their batsman innings record
        if (newBatsmanId) {
          const totalBatters = await tx.batsmanInnings.count({ where: { inningsId: currentInnings.id } });
          await tx.batsmanInnings.create({
            data: {
              inningsId: currentInnings.id,
              playerId: newBatsmanId,
              battingOrder: totalBatters + 1,
            },
          });

          // Set new batsman into position
          if (outPlayerId === strikerId) {
            strikerId = newBatsmanId;
          } else {
            nonStrikerId = newBatsmanId;
          }
        }
      }

      // Calculate strike rotation
      let runsRan = runsBat;
      if (extraType === "BYE" || extraType === "LEG_BYE") runsRan = effectiveExtraRuns;
      else if (extraType === "WIDE") runsRan = Math.max(0, effectiveExtraRuns - 1);
      if (isWicket && wicketType === "RUN_OUT" && runsCompleted !== undefined) {
        runsRan = runsCompleted;
      }

      if (runsRan % 2 === 1) {
        const temp = strikerId;
        strikerId = nonStrikerId;
        nonStrikerId = temp;
      }

      // Over completion check
      let nextBowlerId: string | null = bowlerId;
      const overFinished = isLegal && updatedOver.legalBallsCount === 6;
      if (overFinished) {
        const temp = strikerId;
        strikerId = nonStrikerId;
        nonStrikerId = temp;
        nextBowlerId = null; // Next bowler must be chosen
      }

      // Update Innings Totals
      const updatedTotalRuns = currentInnings.totalRuns + ballTotalRuns;
      const updatedWickets = currentInnings.wickets + (isWicket ? 1 : 0);
      const updatedLegalBalls = currentInnings.legalBalls + (isLegal ? 1 : 0);

      // Check Innings Completion
      const maxBalls = match.oversLimit * 6;
      let isInningsCompleted = false;
      let completionReason = "";

      // 1. All Out (10 wickets)
      if (updatedWickets >= 10) {
        isInningsCompleted = true;
        completionReason = "All Out";
      }
      // 2. Overs completed
      else if (updatedLegalBalls >= maxBalls) {
        isInningsCompleted = true;
        completionReason = "Overs Completed";
      }
      // 3. Target chased down (Innings 2 or Super Over 2)
      else if (currentInnings.targetRuns && updatedTotalRuns >= currentInnings.targetRuns) {
        isInningsCompleted = true;
        completionReason = "Target Reached";
      }

      const updatedInnings = await tx.innings.update({
        where: { id: currentInnings.id },
        data: {
          totalRuns: updatedTotalRuns,
          wickets: updatedWickets,
          legalBalls: updatedLegalBalls,
          wides: extraType === "WIDE" ? { increment: effectiveExtraRuns } : undefined,
          noBalls: extraType === "NO_BALL" ? { increment: effectiveExtraRuns } : undefined,
          byes: extraType === "BYE" ? { increment: effectiveExtraRuns } : undefined,
          legByes: extraType === "LEG_BYE" ? { increment: effectiveExtraRuns } : undefined,
          penalties: extraType === "PENALTY" ? { increment: effectiveExtraRuns } : undefined,
          currentStrikerId: strikerId,
          currentNonStrikerId: nonStrikerId,
          currentBowlerId: nextBowlerId,
          isCompleted: isInningsCompleted,
        },
      });

      // Match Result handling if 2nd Innings completed
      if (isInningsCompleted && currentInnings.inningsNumber >= 2) {
        const firstInnings = await tx.innings.findFirst({
          where: { matchId: match.id, inningsNumber: 1 },
        });

        if (firstInnings) {
          let winnerId: string | null = null;
          let resultType = "NO_RESULT";
          let margin = "";

          let winnerName = "";
          if (updatedTotalRuns > firstInnings.totalRuns) {
            // Chasing team won
            winnerId = currentInnings.battingTeamId;
            resultType = "WICKETS_WIN";
            const wicketsLeft = 10 - updatedWickets;
            const winningTeam = match.teams.find((t: any) => t.teamId === winnerId)?.team;
            winnerName = winningTeam?.name || "Team";
            margin = `${winnerName} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? "s" : ""}`;
          } else if (updatedTotalRuns < firstInnings.totalRuns) {
            // Defending team won
            winnerId = firstInnings.battingTeamId;
            resultType = "RUNS_WIN";
            const runsMargin = firstInnings.totalRuns - updatedTotalRuns;
            const winningTeam = match.teams.find((t: any) => t.teamId === winnerId)?.team;
            winnerName = winningTeam?.name || "Team";
            margin = `${winnerName} won by ${runsMargin} run${runsMargin !== 1 ? "s" : ""}`;
          } else {
            // Match Tied
            resultType = "TIE";
            margin = "Match Tied";
          }

          // Fetch top performers for Player of Match (prioritizing winning team)
          const winningTopBatsman = winnerId
            ? await tx.batsmanInnings.findFirst({
                where: { innings: { matchId: match.id, battingTeamId: winnerId } },
                orderBy: { runs: "desc" },
              })
            : null;

          const matchTopBatsman = await tx.batsmanInnings.findFirst({
            where: { innings: { matchId: match.id } },
            orderBy: { runs: "desc" },
          });

          const winningBestBowler = winnerId
            ? await tx.bowlerInnings.findFirst({
                where: { innings: { matchId: match.id, bowlingTeamId: winnerId } },
                orderBy: [{ wickets: "desc" }, { runsConceded: "asc" }],
              })
            : null;

          const matchBestBowler = await tx.bowlerInnings.findFirst({
            where: { innings: { matchId: match.id } },
            orderBy: [{ wickets: "desc" }, { runsConceded: "asc" }],
          });

          // Priority: Winning team's star performer first
          const pomId =
            winningTopBatsman?.playerId ||
            winningBestBowler?.playerId ||
            matchTopBatsman?.playerId ||
            matchBestBowler?.playerId ||
            null;

          await tx.matchResult.upsert({
            where: { matchId: match.id },
            create: {
              matchId: match.id,
              winnerId,
              resultType,
              margin,
              summary: margin,
              topScorerId: matchTopBatsman?.playerId || null,
              bestBowlerId: matchBestBowler?.playerId || null,
              playerOfMatchId: pomId,
            },
            update: {
              winnerId,
              resultType,
              margin,
              summary: margin,
              topScorerId: matchTopBatsman?.playerId || null,
              bestBowlerId: matchBestBowler?.playerId || null,
              playerOfMatchId: pomId,
            },
          });

          await tx.match.update({
            where: { id: match.id },
            data: {
              status: resultType === "TIE" ? "SUPER_OVER" : "COMPLETED",
            },
          });
        }
      }

      return {
        ball: createdBall,
        innings: updatedInnings,
        overFinished,
        isInningsCompleted,
        completionReason,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Ball recording error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record ball." },
      { status: 500 }
    );
  }
}
