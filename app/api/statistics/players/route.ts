import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatOvers } from "@/lib/scoring/engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get("sortBy") || "runs"; // "runs", "wickets", "strikeRate", "economy"

    const players = await prisma.player.findMany({
      include: {
        team: true,
        batsmanInnings: true,
        bowlerInnings: true,
      },
    });

    const playerStats = players.map((p) => {
      // Batting calculations
      const totalRuns = p.batsmanInnings.reduce((acc, b) => acc + b.runs, 0);
      const totalBalls = p.batsmanInnings.reduce((acc, b) => acc + b.balls, 0);
      const totalFours = p.batsmanInnings.reduce((acc, b) => acc + b.fours, 0);
      const totalSixes = p.batsmanInnings.reduce((acc, b) => acc + b.sixes, 0);
      const dismissals = p.batsmanInnings.filter((b) => b.isOut).length;
      const battingAverage = dismissals > 0 ? (totalRuns / dismissals).toFixed(2) : totalRuns.toFixed(2);
      const strikeRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(2) : "0.00";
      const highestScore = p.batsmanInnings.reduce((max, b) => Math.max(max, b.runs), 0);
      const fifties = p.batsmanInnings.filter((b) => b.runs >= 50 && b.runs < 100).length;
      const hundreds = p.batsmanInnings.filter((b) => b.runs >= 100).length;

      // Bowling calculations
      const totalWickets = p.bowlerInnings.reduce((acc, bw) => acc + bw.wickets, 0);
      const totalRunsConceded = p.bowlerInnings.reduce((acc, bw) => acc + bw.runsConceded, 0);
      const totalLegalBalls = p.bowlerInnings.reduce((acc, bw) => acc + bw.legalBalls, 0);
      const economy = totalLegalBalls > 0 ? (totalRunsConceded / (totalLegalBalls / 6)).toFixed(2) : "0.00";
      const bowlingAverage = totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : "0.00";
      const bestBowlingWickets = p.bowlerInnings.reduce((max, bw) => Math.max(max, bw.wickets), 0);

      return {
        id: p.id,
        name: p.name,
        role: p.role,
        jerseyNumber: p.jerseyNumber,
        teamName: p.team.name,
        teamShort: p.team.shortName,
        teamColor: p.team.color,
        batting: {
          innings: p.batsmanInnings.length,
          runs: totalRuns,
          balls: totalBalls,
          average: battingAverage,
          strikeRate,
          highestScore,
          fifties,
          hundreds,
          fours: totalFours,
          sixes: totalSixes,
        },
        bowling: {
          innings: p.bowlerInnings.length,
          overs: formatOvers(totalLegalBalls),
          runsConceded: totalRunsConceded,
          wickets: totalWickets,
          economy,
          average: bowlingAverage,
          bestBowlingWickets,
        },
      };
    });

    // Sort according to query
    if (sortBy === "wickets") {
      playerStats.sort((a, b) => b.bowling.wickets - a.bowling.wickets);
    } else if (sortBy === "strikeRate") {
      playerStats.sort((a, b) => parseFloat(b.batting.strikeRate) - parseFloat(a.batting.strikeRate));
    } else if (sortBy === "economy") {
      playerStats.sort((a, b) => parseFloat(a.bowling.economy) - parseFloat(b.bowling.economy));
    } else {
      playerStats.sort((a, b) => b.batting.runs - a.batting.runs);
    }

    return NextResponse.json({ players: playerStats });
  } catch (error) {
    console.error("Player statistics error:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
