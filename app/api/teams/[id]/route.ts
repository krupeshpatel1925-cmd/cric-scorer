import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        players: {
          orderBy: { jerseyNumber: "asc" },
        },
        matchTeams: {
          include: {
            match: {
              include: {
                teams: { include: { team: true } },
                result: true,
              },
            },
          },
        },
        matchesWon: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Fetch team detail error:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const { name, shortName, color, logoUrl } = await req.json();

    const team = await prisma.team.update({
      where: { id },
      data: {
        name,
        shortName: shortName?.toUpperCase(),
        color,
        logoUrl,
      },
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Update team error:", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    await prisma.team.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Delete team error:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
