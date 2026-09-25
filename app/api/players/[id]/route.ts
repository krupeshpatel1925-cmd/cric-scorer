import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        team: true,
        batsmanInnings: {
          include: {
            innings: {
              include: {
                match: true,
              },
            },
          },
        },
        bowlerInnings: {
          include: {
            innings: {
              include: {
                match: true,
              },
            },
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Calculate career aggregates
    const totalRuns = player.batsmanInnings.reduce((sum, b) => sum + b.runs, 0);
    const totalBalls = player.batsmanInnings.reduce((sum, b) => sum + b.balls, 0);
    const totalFours = player.batsmanInnings.reduce((sum, b) => sum + b.fours, 0);
    const totalSixes = player.batsmanInnings.reduce((sum, b) => sum + b.sixes, 0);
    const fifties = player.batsmanInnings.filter((b) => b.runs >= 50 && b.runs < 100).length;
    const hundreds = player.batsmanInnings.filter((b) => b.runs >= 100).length;
    const highestScore = player.batsmanInnings.reduce((max, b) => Math.max(max, b.runs), 0);
    const dismissals = player.batsmanInnings.filter((b) => b.isOut).length;
    const battingAvg = dismissals > 0 ? (totalRuns / dismissals).toFixed(2) : totalRuns.toFixed(2);
    const battingSR = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(2) : "0.00";

    const totalWickets = player.bowlerInnings.reduce((sum, b) => sum + b.wickets, 0);
    const totalRunsConceded = player.bowlerInnings.reduce((sum, b) => sum + b.runsConceded, 0);
    const totalLegalBalls = player.bowlerInnings.reduce((sum, b) => sum + b.legalBalls, 0);
    const bowlingEcon = totalLegalBalls > 0 ? (totalRunsConceded / (totalLegalBalls / 6)).toFixed(2) : "0.00";
    const bowlingAvg = totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : "0.00";

    return NextResponse.json({
      player,
      career: {
        batting: {
          innings: player.batsmanInnings.length,
          runs: totalRuns,
          balls: totalBalls,
          fours: totalFours,
          sixes: totalSixes,
          fifties,
          hundreds,
          highestScore,
          average: battingAvg,
          strikeRate: battingSR,
        },
        bowling: {
          innings: player.bowlerInnings.length,
          overs: `${Math.floor(totalLegalBalls / 6)}.${totalLegalBalls % 6}`,
          runsConceded: totalRunsConceded,
          wickets: totalWickets,
          economy: bowlingEcon,
          average: bowlingAvg,
        },
      },
    });
  } catch (error) {
    console.error("Fetch player detail error:", error);
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const { name, jerseyNumber, role, battingStyle, bowlingStyle } = await req.json();

    const player = await prisma.player.update({
      where: { id },
      data: {
        name,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : null,
        role,
        battingStyle,
        bowlingStyle,
      },
    });

    return NextResponse.json({ player });
  } catch (error) {
    console.error("Update player error:", error);
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    await prisma.player.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Player deleted successfully" });
  } catch (error) {
    console.error("Delete player error:", error);
    return NextResponse.json({ error: "Failed to delete player" }, { status: 500 });
  }
}
