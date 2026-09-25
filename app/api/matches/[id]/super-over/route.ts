import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: matchId } = await params;
    const body = await req.json();
    const {
      superOverBattingTeamId,
      superOverBowlingTeamId,
      openingStrikerId,
      openingNonStrikerId,
      openingBowlerId,
    } = body;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        innings: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const nextInningsNum = match.innings.length + 1; // 3 for 1st super over innings, 4 for 2nd

    let targetRuns: number | null = null;
    if (nextInningsNum === 4) {
      const superOver1 = match.innings.find((i) => i.inningsNumber === 3);
      if (superOver1) {
        targetRuns = superOver1.totalRuns + 1;
      }
    }

    const superOverInnings = await prisma.innings.create({
      data: {
        matchId: match.id,
        inningsNumber: nextInningsNum,
        battingTeamId: superOverBattingTeamId,
        bowlingTeamId: superOverBowlingTeamId,
        targetRuns,
        currentStrikerId: openingStrikerId || null,
        currentNonStrikerId: openingNonStrikerId || null,
        currentBowlerId: openingBowlerId || null,
      },
    });

    if (openingStrikerId) {
      await prisma.batsmanInnings.create({
        data: {
          inningsId: superOverInnings.id,
          playerId: openingStrikerId,
          battingOrder: 1,
        },
      });
    }

    if (openingNonStrikerId) {
      await prisma.batsmanInnings.create({
        data: {
          inningsId: superOverInnings.id,
          playerId: openingNonStrikerId,
          battingOrder: 2,
        },
      });
    }

    if (openingBowlerId) {
      await prisma.bowlerInnings.create({
        data: {
          inningsId: superOverInnings.id,
          playerId: openingBowlerId,
        },
      });
    }

    await prisma.match.update({
      where: { id: match.id },
      data: { status: "SUPER_OVER" },
    });

    return NextResponse.json({ superOverInnings });
  } catch (error) {
    console.error("Super over init error:", error);
    return NextResponse.json({ error: "Failed to initiate super over" }, { status: 500 });
  }
}
