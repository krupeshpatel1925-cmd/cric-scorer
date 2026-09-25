import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: matchId } = await params;
    const body = await req.json().catch(() => ({}));
    const { openingStrikerId, openingNonStrikerId, openingBowlerId } = body;

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

    // Conclude current innings
    await prisma.innings.update({
      where: { id: currentInnings.id },
      data: { isCompleted: true },
    });

    // If this was Innings 1, initialize Innings 2!
    if (currentInnings.inningsNumber === 1) {
      const targetRuns = currentInnings.totalRuns + 1;

      const innings2 = await prisma.innings.create({
        data: {
          matchId: match.id,
          inningsNumber: 2,
          battingTeamId: currentInnings.bowlingTeamId,
          bowlingTeamId: currentInnings.battingTeamId,
          targetRuns,
          currentStrikerId: openingStrikerId || null,
          currentNonStrikerId: openingNonStrikerId || null,
          currentBowlerId: openingBowlerId || null,
        },
      });

      if (openingStrikerId) {
        await prisma.batsmanInnings.create({
          data: {
            inningsId: innings2.id,
            playerId: openingStrikerId,
            battingOrder: 1,
          },
        });
      }

      if (openingNonStrikerId) {
        await prisma.batsmanInnings.create({
          data: {
            inningsId: innings2.id,
            playerId: openingNonStrikerId,
            battingOrder: 2,
          },
        });
      }

      if (openingBowlerId) {
        await prisma.bowlerInnings.create({
          data: {
            inningsId: innings2.id,
            playerId: openingBowlerId,
          },
        });
      }

      return NextResponse.json({
        message: "Innings 1 concluded, Innings 2 started.",
        nextInnings: innings2,
      });
    }

    // If this was Innings 2, finalize Match Result
    const firstInnings = await prisma.innings.findFirst({
      where: { matchId: match.id, inningsNumber: 1 },
    });

    if (firstInnings) {
      let winnerId: string | null = null;
      let resultType = "NO_RESULT";
      let margin = "";

      let winnerName = "";
      if (winnerId) {
        const winnerTeam = await prisma.team.findUnique({ where: { id: winnerId } });
        winnerName = winnerTeam?.name || "Team";
      }

      if (currentInnings.totalRuns > firstInnings.totalRuns) {
        winnerId = currentInnings.battingTeamId;
        resultType = "WICKETS_WIN";
        const wicketsLeft = 10 - currentInnings.wickets;
        const winnerTeam = await prisma.team.findUnique({ where: { id: winnerId } });
        winnerName = winnerTeam?.name || "Team";
        margin = `${winnerName} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? "s" : ""}`;
      } else if (currentInnings.totalRuns < firstInnings.totalRuns) {
        winnerId = firstInnings.battingTeamId;
        resultType = "RUNS_WIN";
        const runsMargin = firstInnings.totalRuns - currentInnings.totalRuns;
        const winnerTeam = await prisma.team.findUnique({ where: { id: winnerId } });
        winnerName = winnerTeam?.name || "Team";
        margin = `${winnerName} won by ${runsMargin} run${runsMargin !== 1 ? "s" : ""}`;
      } else {
        resultType = "TIE";
        margin = "Match Tied";
      }

      // Fetch top performers for Player of Match (prioritizing winning team)
      const winningTopBatsman = winnerId
        ? await prisma.batsmanInnings.findFirst({
            where: { innings: { matchId: match.id, battingTeamId: winnerId } },
            orderBy: { runs: "desc" },
          })
        : null;

      const matchTopBatsman = await prisma.batsmanInnings.findFirst({
        where: { innings: { matchId: match.id } },
        orderBy: { runs: "desc" },
      });

      const winningBestBowler = winnerId
        ? await prisma.bowlerInnings.findFirst({
            where: { innings: { matchId: match.id, bowlingTeamId: winnerId } },
            orderBy: [{ wickets: "desc" }, { runsConceded: "asc" }],
          })
        : null;

      const matchBestBowler = await prisma.bowlerInnings.findFirst({
        where: { innings: { matchId: match.id } },
        orderBy: [{ wickets: "desc" }, { runsConceded: "asc" }],
      });

      const pomId =
        winningTopBatsman?.playerId ||
        winningBestBowler?.playerId ||
        matchTopBatsman?.playerId ||
        matchBestBowler?.playerId ||
        null;

      await prisma.matchResult.upsert({
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

      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: resultType === "TIE" ? "SUPER_OVER" : "COMPLETED",
        },
      });
    }

    return NextResponse.json({ message: "Match completed." });
  } catch (error) {
    console.error("End innings error:", error);
    return NextResponse.json({ error: "Failed to end innings" }, { status: 500 });
  }
}
