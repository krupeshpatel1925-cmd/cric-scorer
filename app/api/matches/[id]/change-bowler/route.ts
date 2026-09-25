import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const { bowlerId } = await req.json();

    if (!bowlerId) {
      return NextResponse.json({ error: "Bowler ID is required" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        innings: {
          orderBy: { inningsNumber: "desc" },
          take: 1,
        },
      },
    });

    const currentInnings = match?.innings[0];
    if (!currentInnings) {
      return NextResponse.json({ error: "Active innings not found" }, { status: 404 });
    }

    // Ensure bowlerInnings entry exists
    await prisma.bowlerInnings.upsert({
      where: {
        inningsId_playerId: {
          inningsId: currentInnings.id,
          playerId: bowlerId,
        },
      },
      create: {
        inningsId: currentInnings.id,
        playerId: bowlerId,
      },
      update: {},
    });

    const updatedInnings = await prisma.innings.update({
      where: { id: currentInnings.id },
      data: {
        currentBowlerId: bowlerId,
      },
    });

    return NextResponse.json({ innings: updatedInnings });
  } catch (error) {
    console.error("Change bowler error:", error);
    return NextResponse.json({ error: "Failed to change bowler" }, { status: 500 });
  }
}
