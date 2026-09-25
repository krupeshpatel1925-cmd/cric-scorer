import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth/jwt";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        players: true,
        matchTeams: {
          include: {
            match: {
              select: { id: true, status: true, result: true },
            },
          },
        },
        matchesWon: true,
      },
      orderBy: { name: "asc" },
    });

    const enrichedTeams = teams.map((team) => {
      const totalMatches = team.matchTeams.length;
      const wins = team.matchesWon.length;
      const completedMatches = team.matchTeams.filter((mt) => mt.match.status === "COMPLETED").length;
      const losses = Math.max(0, completedMatches - wins);
      const winPct = completedMatches > 0 ? ((wins / completedMatches) * 100).toFixed(1) : "0.0";

      return {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        logoUrl: team.logoUrl,
        color: team.color,
        playerCount: team.players.length,
        players: team.players,
        stats: {
          totalMatches,
          completedMatches,
          wins,
          losses,
          winPct,
        },
      };
    });

    return NextResponse.json({ teams: enrichedTeams });
  } catch (error) {
    console.error("Fetch teams error:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    const body = await req.json();
    const { name, shortName, color, logoUrl } = body;

    if (!name || !shortName) {
      return NextResponse.json(
        { error: "Team name and short code are required" },
        { status: 400 }
      );
    }

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
        console.warn("Could not verify auth user in db:", err);
      }
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        shortName: shortName.trim().toUpperCase(),
        color: color || "#10b981",
        logoUrl: logoUrl || null,
        userId: validUserId,
      },
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error: any) {
    console.error("Create team error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create team" },
      { status: 500 }
    );
  }
}
