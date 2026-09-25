import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatOvers, calculateStrikeRate, calculateEconomy } from "@/lib/scoring/engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        innings: {
          orderBy: { inningsNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const currentInnings = match.innings[0];
    if (!currentInnings) {
      return NextResponse.json({ error: "No active innings found" }, { status: 400 });
    }

    const lastBall = await prisma.ball.findFirst({
      where: { inningsId: currentInnings.id },
      orderBy: { ballIndex: "desc" },
      include: { over: true, wicket: true },
    });

    if (!lastBall) {
      return NextResponse.json({ error: "No balls to undo in this innings." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete the wicket if exists
      if (lastBall.wicket) {
        await tx.wicket.delete({
          where: { id: lastBall.wicket.id },
        });
      }

      // 2. Delete the ball
      await tx.ball.delete({
        where: { id: lastBall.id },
      });

      // 3. Check if over is now empty, delete if 0 balls
      const remainingBallsInOver = await tx.ball.count({
        where: { overId: lastBall.overId },
      });

      if (remainingBallsInOver === 0) {
        await tx.over.delete({
          where: { id: lastBall.overId },
        });
      } else {
        // Recompute over stats
        const isLegal = lastBall.isLegal;
        let runsCharged = lastBall.runsBat;
        if (lastBall.extraType === "WIDE" || lastBall.extraType === "NO_BALL") {
          runsCharged += lastBall.extraRuns;
        }

        await tx.over.update({
          where: { id: lastBall.overId },
          data: {
            legalBallsCount: isLegal ? { decrement: 1 } : undefined,
            totalBallsCount: { decrement: 1 },
            runsConceded: { decrement: runsCharged },
            wicketsCount: lastBall.isWicket ? { decrement: 1 } : undefined,
            isMaiden: false,
          },
        });
      }

      // 4. Rollback Striker Batsman stats
      const striker = await tx.batsmanInnings.findUnique({
        where: {
          inningsId_playerId: {
            inningsId: currentInnings.id,
            playerId: lastBall.batsmanId,
          },
        },
      });

      if (striker) {
        const newRuns = Math.max(0, striker.runs - lastBall.runsBat);
        const newBalls = lastBall.extraType !== "WIDE" ? Math.max(0, striker.balls - 1) : striker.balls;
        const newFours = lastBall.isBoundary || lastBall.runsBat === 4 ? Math.max(0, striker.fours - 1) : striker.fours;
        const newSixes = lastBall.isSix || lastBall.runsBat === 6 ? Math.max(0, striker.sixes - 1) : striker.sixes;
        const newSR = calculateStrikeRate(newRuns, newBalls);

        await tx.batsmanInnings.update({
          where: { id: striker.id },
          data: {
            runs: newRuns,
            balls: newBalls,
            fours: newFours,
            sixes: newSixes,
            strikeRate: newSR,
            isOut: lastBall.isWicket && (lastBall.dismissedPlayerId === lastBall.batsmanId || !lastBall.dismissedPlayerId) ? false : striker.isOut,
            dismissalType: lastBall.isWicket && (lastBall.dismissedPlayerId === lastBall.batsmanId || !lastBall.dismissedPlayerId) ? null : striker.dismissalType,
            bowlerId: lastBall.isWicket && (lastBall.dismissedPlayerId === lastBall.batsmanId || !lastBall.dismissedPlayerId) ? null : striker.bowlerId,
            fielderId: lastBall.isWicket && (lastBall.dismissedPlayerId === lastBall.batsmanId || !lastBall.dismissedPlayerId) ? null : striker.fielderId,
          },
        });
      }

      // If dismissed player was someone else (e.g. run out)
      if (lastBall.isWicket && lastBall.dismissedPlayerId && lastBall.dismissedPlayerId !== lastBall.batsmanId) {
        await tx.batsmanInnings.updateMany({
          where: {
            inningsId: currentInnings.id,
            playerId: lastBall.dismissedPlayerId,
          },
          data: {
            isOut: false,
            dismissalType: null,
            bowlerId: null,
            fielderId: null,
          },
        });
      }

      // 5. Rollback Bowler stats
      const bowler = await tx.bowlerInnings.findUnique({
        where: {
          inningsId_playerId: {
            inningsId: currentInnings.id,
            playerId: lastBall.bowlerId,
          },
        },
      });

      if (bowler) {
        let runsCharged = lastBall.runsBat;
        if (lastBall.extraType === "WIDE" || lastBall.extraType === "NO_BALL") {
          runsCharged += lastBall.extraRuns;
        }

        const newLegal = lastBall.isLegal ? Math.max(0, bowler.legalBalls - 1) : bowler.legalBalls;
        const newConceded = Math.max(0, bowler.runsConceded - runsCharged);
        const isBowlerWicket =
          lastBall.isWicket &&
          lastBall.wicketType !== "RUN_OUT" &&
          lastBall.wicketType !== "RETIRED_HURT" &&
          lastBall.wicketType !== "RETIRED_OUT";
        const newWickets = isBowlerWicket ? Math.max(0, bowler.wickets - 1) : bowler.wickets;
        const wasDot = lastBall.isLegal && lastBall.runsBat + lastBall.extraRuns === 0;
        const newDots = wasDot ? Math.max(0, bowler.dots - 1) : bowler.dots;

        await tx.bowlerInnings.update({
          where: { id: bowler.id },
          data: {
            legalBalls: newLegal,
            overs: parseFloat(formatOvers(newLegal)),
            runsConceded: newConceded,
            wickets: newWickets,
            dots: newDots,
            wides: lastBall.extraType === "WIDE" ? Math.max(0, bowler.wides - lastBall.extraRuns) : bowler.wides,
            noBalls: lastBall.extraType === "NO_BALL" ? Math.max(0, bowler.noBalls - lastBall.extraRuns) : bowler.noBalls,
            economy: calculateEconomy(newConceded, newLegal),
          },
        });
      }

      // 6. Rollback Innings Totals
      const totalBallRuns = lastBall.runsBat + lastBall.extraRuns;
      await tx.innings.update({
        where: { id: currentInnings.id },
        data: {
          totalRuns: Math.max(0, currentInnings.totalRuns - totalBallRuns),
          wickets: lastBall.isWicket ? Math.max(0, currentInnings.wickets - 1) : currentInnings.wickets,
          legalBalls: lastBall.isLegal ? Math.max(0, currentInnings.legalBalls - 1) : currentInnings.legalBalls,
          wides: lastBall.extraType === "WIDE" ? Math.max(0, currentInnings.wides - lastBall.extraRuns) : undefined,
          noBalls: lastBall.extraType === "NO_BALL" ? Math.max(0, currentInnings.noBalls - lastBall.extraRuns) : undefined,
          byes: lastBall.extraType === "BYE" ? Math.max(0, currentInnings.byes - lastBall.extraRuns) : undefined,
          legByes: lastBall.extraType === "LEG_BYE" ? Math.max(0, currentInnings.legByes - lastBall.extraRuns) : undefined,
          penalties: lastBall.extraType === "PENALTY" ? Math.max(0, currentInnings.penalties - lastBall.extraRuns) : undefined,
          currentStrikerId: lastBall.batsmanId,
          currentNonStrikerId: lastBall.nonStrikerId,
          currentBowlerId: lastBall.bowlerId,
          isCompleted: false,
        },
      });

      // 7. Reset match status if it was completed
      if (match.status === "COMPLETED" || match.status === "SUPER_OVER") {
        await tx.match.update({
          where: { id: match.id },
          data: { status: "LIVE" },
        });

        await tx.matchResult.deleteMany({
          where: { matchId: match.id },
        });
      }
    });

    return NextResponse.json({ message: "Last ball undone successfully." });
  } catch (error: any) {
    console.error("Undo ball error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to undo ball." },
      { status: 500 }
    );
  }
}
