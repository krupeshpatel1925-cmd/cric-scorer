import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: matchId } = await params;
    const body = await req.json();
    const { strikerId, nonStrikerId } = body;

    if (!strikerId && !nonStrikerId) {
      return NextResponse.json(
        { error: "At least one batsman ID must be provided." },
        { status: 400 }
      );
    }

    if (strikerId && nonStrikerId && strikerId === nonStrikerId) {
      return NextResponse.json(
        { error: "Striker and non-striker cannot be the same player." },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
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

    if (currentInnings.isCompleted) {
      return NextResponse.json(
        { error: "Cannot change batsmen on a completed innings." },
        { status: 400 }
      );
    }

    // Ensure batsmanInnings record exists for striker
    if (strikerId) {
      await prisma.batsmanInnings.upsert({
        where: {
          inningsId_playerId: {
            inningsId: currentInnings.id,
            playerId: strikerId,
          },
        },
        create: {
          inningsId: currentInnings.id,
          playerId: strikerId,
          battingOrder: 1,
        },
        update: {},
      });
    }

    // Ensure batsmanInnings record exists for non-striker
    if (nonStrikerId) {
      await prisma.batsmanInnings.upsert({
        where: {
          inningsId_playerId: {
            inningsId: currentInnings.id,
            playerId: nonStrikerId,
          },
        },
        create: {
          inningsId: currentInnings.id,
          playerId: nonStrikerId,
          battingOrder: 2,
        },
        update: {},
      });
    }

    const updatedInnings = await prisma.innings.update({
      where: { id: currentInnings.id },
      data: {
        currentStrikerId: strikerId || currentInnings.currentStrikerId,
        currentNonStrikerId: nonStrikerId || currentInnings.currentNonStrikerId,
      },
    });

    return NextResponse.json({
      message: "Batsmen updated successfully.",
      innings: updatedInnings,
    });
  } catch (error: any) {
    console.error("Change batsmen error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update batsmen." },
      { status: 500 }
    );
  }
}
