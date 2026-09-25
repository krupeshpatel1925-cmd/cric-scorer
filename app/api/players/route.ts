import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    const where = teamId ? { teamId } : {};

    const players = await prisma.player.findMany({
      where,
      include: {
        team: {
          select: { id: true, name: true, shortName: true, color: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ players });
  } catch (error) {
    console.error("Fetch players error:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, jerseyNumber, role, battingStyle, bowlingStyle, teamId } = await req.json();

    if (!name || !role || !teamId) {
      return NextResponse.json(
        { error: "Name, role, and teamId are required" },
        { status: 400 }
      );
    }

    const player = await prisma.player.create({
      data: {
        name,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : null,
        role,
        battingStyle: battingStyle || "Right-hand bat",
        bowlingStyle: bowlingStyle || null,
        teamId,
      },
    });

    return NextResponse.json({ player }, { status: 201 });
  } catch (error) {
    console.error("Create player error:", error);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}
