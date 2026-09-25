import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        matchTeams: {
          include: {
            match: {
              include: {
                result: true,
                innings: true,
              },
            },
          },
        },
        matchesWon: true,
      },
    });

    const teamStats = teams.map((team) => {
      const completedMatches = team.matchTeams
        .map((mt) => mt.match)
        .filter((m) => m.status === "COMPLETED");

      const totalMatches = completedMatches.length;
      const wins = team.matchesWon.length;
      const ties = completedMatches.filter((m) => m.result?.resultType === "TIE").length;
      const losses = Math.max(0, totalMatches - wins - ties);
      const winPercentage = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : "0.0";

      // Team scores in matches
      const teamInnings = team.matchTeams.flatMap((mt) =>
        mt.match.innings.filter((i) => i.battingTeamId === team.id)
      );

      const highestScore = teamInnings.reduce((max, i) => Math.max(max, i.totalRuns), 0);
      const lowestScore = teamInnings.length > 0
        ? teamInnings.reduce((min, i) => Math.min(min, i.totalRuns), 9999)
        : 0;

      return {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        color: team.color,
        matches: totalMatches,
        wins,
        losses,
        ties,
        winPercentage,
        highestScore,
        lowestScore: lowestScore === 9999 ? 0 : lowestScore,
      };
    });

    teamStats.sort((a, b) => parseFloat(b.winPercentage) - parseFloat(a.winPercentage));

    return NextResponse.json({ teams: teamStats });
  } catch (error) {
    console.error("Team statistics error:", error);
    return NextResponse.json({ error: "Failed to fetch team statistics" }, { status: 500 });
  }
}
