import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const format = searchParams.get("format");
    const search = searchParams.get("search");

    const where: any = {};
    if (status) where.status = status;
    if (format) where.format = format;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { tournament: { contains: search } },
        { venue: { contains: search } },
      ];
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        teams: {
          include: {
            team: true,
          },
        },
        innings: {
          include: {
            battingTeam: true,
            bowlingTeam: true,
          },
          orderBy: { inningsNumber: "asc" },
        },
        result: {
          include: {
            winner: true,
          },
        },
      },
      orderBy: { matchDate: "desc" },
    });

    const processedMatches = await Promise.all(
      matches.map(async (m) => {
        let margin = m.result?.margin;
        const winnerName =
          m.result?.winner?.name ||
          m.teams.find((t) => t.teamId === m.result?.winnerId)?.team?.name;
        if (
          margin &&
          winnerName &&
          margin.toLowerCase().startsWith("won by") &&
          !margin.toLowerCase().includes(winnerName.toLowerCase())
        ) {
          const formatted = `${winnerName} ${margin.charAt(0).toLowerCase() + margin.slice(1)}`;
          try {
            await prisma.matchResult.update({
              where: { id: m.result!.id },
              data: { margin: formatted, summary: formatted },
            });
          } catch {}
          margin = formatted;
        }
        return {
          ...m,
          result: m.result ? { ...m.result, margin } : null,
        };
      })
    );

    return NextResponse.json({ matches: processedMatches });
  } catch (error) {
    console.error("Fetch matches error:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    const body = await req.json();
    const {
      name,
      tournament,
      venue,
      matchDate,
      format,
      oversLimit,
      ballType,
      teamAId,
      teamBId,
      teamACaptainId,
      teamAWicketkeeperId,
      teamBCaptainId,
      teamBWicketkeeperId,
      teamAPlayingXI, // array of playerIds
      teamBPlayingXI, // array of playerIds
      tossWinnerId,
      tossDecision, // "BAT" or "BOWL"
      openingStrikerId,
      openingNonStrikerId,
      openingBowlerId,
    } = body;

    if (!teamAId || !teamBId || !tossWinnerId || !tossDecision) {
      return NextResponse.json(
        { error: "Teams, toss winner, and toss decision are required." },
        { status: 400 }
      );
    }

    // Determine 1st innings batting and bowling teams
    let battingTeamId = tossWinnerId;
    let bowlingTeamId = tossWinnerId === teamAId ? teamBId : teamAId;

    if (tossDecision === "BOWL") {
      battingTeamId = tossWinnerId === teamAId ? teamBId : teamAId;
      bowlingTeamId = tossWinnerId;
    }

    const matchName = name || "Cricket Match";
    const totalOvers = oversLimit ? parseInt(oversLimit, 10) : 20;

    let validUserId: string | null = null;
    if (authUser?.userId) {
      try {
        const userExists = await prisma.user.findUnique({
          where: { id: authUser.userId },
          select: { id: true },
        });
        if (userExists) {
          validUserId = userExists.id;
        }
      } catch (err) {
        console.warn("Could not verify auth user:", err);
      }
    }

    // Create Match, MatchTeam, PlayingXI and Innings 1 in a single transaction
    const match = await prisma.$transaction(async (tx) => {
      const newMatch = await tx.match.create({
        data: {
          name: matchName,
          tournament: tournament || null,
          venue: venue || null,
          matchDate: matchDate ? new Date(matchDate) : new Date(),
          format: format || "CUSTOM",
          oversLimit: totalOvers,
          ballType: ballType || "LEATHER",
          status: "LIVE",
          tossWinnerId,
          tossDecision,
          userId: validUserId,
        },
      });

      // Match teams
      await tx.matchTeam.createMany({
        data: [
          {
            matchId: newMatch.id,
            teamId: teamAId,
            captainId: teamACaptainId || null,
            wicketkeeperId: teamAWicketkeeperId || null,
          },
          {
            matchId: newMatch.id,
            teamId: teamBId,
            captainId: teamBCaptainId || null,
            wicketkeeperId: teamBWicketkeeperId || null,
          },
        ],
      });

      // Playing XI entries
      const playingXIRecords: any[] = [];
      if (Array.isArray(teamAPlayingXI)) {
        teamAPlayingXI.forEach((pid, idx) => {
          playingXIRecords.push({
            matchId: newMatch.id,
            teamId: teamAId,
            playerId: pid,
            isCaptain: pid === teamACaptainId,
            isWicketKeeper: pid === teamAWicketkeeperId,
            battingPosition: idx + 1,
          });
        });
      }

      if (Array.isArray(teamBPlayingXI)) {
        teamBPlayingXI.forEach((pid, idx) => {
          playingXIRecords.push({
            matchId: newMatch.id,
            teamId: teamBId,
            playerId: pid,
            isCaptain: pid === teamBCaptainId,
            isWicketKeeper: pid === teamBWicketkeeperId,
            battingPosition: idx + 1,
          });
        });
      }

      if (playingXIRecords.length > 0) {
        await tx.playingXI.createMany({
          data: playingXIRecords,
        });
      }

      // Create Innings 1
      const innings1 = await tx.innings.create({
        data: {
          matchId: newMatch.id,
          inningsNumber: 1,
          battingTeamId,
          bowlingTeamId,
          currentStrikerId: openingStrikerId || null,
          currentNonStrikerId: openingNonStrikerId || null,
          currentBowlerId: openingBowlerId || null,
        },
      });

      // Initialize batsman innings for openers if selected
      if (openingStrikerId) {
        await tx.batsmanInnings.create({
          data: {
            inningsId: innings1.id,
            playerId: openingStrikerId,
            battingOrder: 1,
          },
        });
      }

      if (openingNonStrikerId) {
        await tx.batsmanInnings.create({
          data: {
            inningsId: innings1.id,
            playerId: openingNonStrikerId,
            battingOrder: 2,
          },
        });
      }

      if (openingBowlerId) {
        await tx.bowlerInnings.create({
          data: {
            inningsId: innings1.id,
            playerId: openingBowlerId,
          },
        });
      }

      return newMatch;
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    console.error("Create match error:", error);
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
