import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
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

    const temp = currentInnings.currentStrikerId;
    const updatedInnings = await prisma.innings.update({
      where: { id: currentInnings.id },
      data: {
        currentStrikerId: currentInnings.currentNonStrikerId,
        currentNonStrikerId: temp,
      },
    });

    return NextResponse.json({ innings: updatedInnings });
  } catch (error) {
    console.error("Change strike error:", error);
    return NextResponse.json({ error: "Failed to change strike" }, { status: 500 });
  }
}
