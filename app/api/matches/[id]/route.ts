import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            team: {
              include: {
                players: true,
              },
            },
          },
        },
        playingXI: {
          include: {
            player: true,
          },
          orderBy: { battingPosition: "asc" },
        },
        innings: {
          include: {
            battingTeam: true,
            bowlingTeam: true,
            overs: {
              include: {
                balls: {
                  include: {
                    wicket: true,
                  },
                  orderBy: { ballIndex: "asc" },
                },
              },
              orderBy: { overNumber: "asc" },
            },
            batsmen: {
              include: {
                player: true,
              },
              orderBy: { battingOrder: "asc" },
            },
            bowlers: {
              include: {
                player: true,
              },
            },
            partnerships: true,
            balls: {
              orderBy: { ballIndex: "desc" },
              take: 30, // Most recent balls
            },
          },
          orderBy: { inningsNumber: "asc" },
        },
        result: {
          include: {
            winner: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.result && match.result.margin && match.result.margin.toLowerCase().startsWith("won by")) {
      const winnerName =
        match.result.winner?.name ||
        match.teams.find((t) => t.teamId === match.result?.winnerId)?.team?.name;
      if (winnerName && !match.result.margin.toLowerCase().includes(winnerName.toLowerCase())) {
        const formatted = `${winnerName} ${match.result.margin.charAt(0).toLowerCase() + match.result.margin.slice(1)}`;
        match.result.margin = formatted;
        match.result.summary = formatted;
      }
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Fetch match error:", error);
    return NextResponse.json({ error: "Failed to fetch match details" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, tournament, venue, status, format, oversLimit } = body;

    const match = await prisma.match.update({
      where: { id },
      data: {
        name,
        tournament,
        venue,
        status,
        format,
        oversLimit: oversLimit ? parseInt(oversLimit, 10) : undefined,
      },
    });

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Update match error:", error);
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    await prisma.match.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Match deleted successfully" });
  } catch (error) {
    console.error("Delete match error:", error);
    return NextResponse.json({ error: "Failed to delete match" }, { status: 500 });
  }
}
