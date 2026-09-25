import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatOvers } from "@/lib/scoring/engine";

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
            team: true,
          },
        },
        playingXI: {
          include: {
            player: true,
          },
        },
        result: {
          include: {
            winner: true,
          },
        },
        innings: {
          include: {
            battingTeam: true,
            bowlingTeam: true,
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
            overs: {
              include: {
                balls: {
                  include: {
                    wicket: {
                      include: {
                        fielder: true,
                        bowler: true,
                      },
                    },
                  },
                  orderBy: { ballIndex: "asc" },
                },
              },
              orderBy: { overNumber: "asc" },
            },
            balls: {
              include: {
                wicket: {
                  include: {
                    batsman: true,
                    fielder: true,
                    bowler: true,
                  },
                },
              },
              orderBy: { ballIndex: "asc" },
            },
          },
          orderBy: { inningsNumber: "asc" },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Build rich scorecard for each innings
    const inningsScorecards = match.innings.map((innings) => {
      const allPlayingBatters = match.playingXI.filter(
        (pxi) => pxi.teamId === innings.battingTeamId
      );

      const battedPlayerIds = new Set(innings.batsmen.map((b) => b.playerId));
      const didNotBat = allPlayingBatters
        .filter((pxi) => !battedPlayerIds.has(pxi.playerId))
        .map((pxi) => ({
          id: pxi.playerId,
          name: pxi.player.name,
          role: pxi.player.role,
        }));

      // Dismissal string formatting
      const batting = innings.batsmen.map((b) => {
        let dismissal = "not out";
        if (b.isOut) {
          if (b.dismissalType === "BOWLED") {
            dismissal = b.bowlerId ? `b Bowler` : "b bowler";
          } else if (b.dismissalType === "CAUGHT") {
            dismissal = b.fielderId ? `c Fielder b Bowler` : "c & b Bowler";
          } else if (b.dismissalType === "LBW") {
            dismissal = `lbw b Bowler`;
          } else if (b.dismissalType === "RUN_OUT") {
            dismissal = `run out`;
          } else if (b.dismissalType === "STUMPED") {
            dismissal = `st Keeper b Bowler`;
          } else {
            dismissal = b.dismissalType?.toLowerCase() || "out";
          }
        }

        return {
          id: b.id,
          playerId: b.playerId,
          name: b.player.name,
          runs: b.runs,
          balls: b.balls,
          fours: b.fours,
          sixes: b.sixes,
          strikeRate: b.strikeRate,
          isOut: b.isOut,
          dismissal,
        };
      });

      // Bowling figures
      const bowling = innings.bowlers.map((bw) => ({
        id: bw.id,
        playerId: bw.playerId,
        name: bw.player.name,
        overs: formatOvers(bw.legalBalls),
        maidens: bw.maidens,
        runsConceded: bw.runsConceded,
        wickets: bw.wickets,
        economy: bw.economy,
        dots: bw.dots,
        wides: bw.wides,
        noBalls: bw.noBalls,
      }));

      // Fall of Wickets from ball events
      const fallOfWickets = innings.balls
        .filter((b) => b.isWicket && b.wicket)
        .map((b) => ({
          wicketNumber: b.wicket!.wicketNumber,
          runs: b.wicket!.teamRuns,
          over: b.wicket!.overNumber,
          batsmanName: b.wicket!.batsman?.name || "Batsman",
        }));

      const totalExtras =
        innings.wides + innings.noBalls + innings.byes + innings.legByes + innings.penalties;
      const oversFormatted = formatOvers(innings.legalBalls);
      const runRate =
        innings.legalBalls > 0
          ? ((innings.totalRuns / (innings.legalBalls / 6))).toFixed(2)
          : "0.00";

      return {
        id: innings.id,
        inningsNumber: innings.inningsNumber,
        battingTeam: {
          id: innings.battingTeam.id,
          name: innings.battingTeam.name,
          shortName: innings.battingTeam.shortName,
          color: innings.battingTeam.color,
        },
        bowlingTeam: {
          id: innings.bowlingTeam.id,
          name: innings.bowlingTeam.name,
          shortName: innings.bowlingTeam.shortName,
          color: innings.bowlingTeam.color,
        },
        totalRuns: innings.totalRuns,
        wickets: innings.wickets,
        overs: oversFormatted,
        legalBalls: innings.legalBalls,
        runRate,
        targetRuns: innings.targetRuns,
        isCompleted: innings.isCompleted,
        extras: {
          wides: innings.wides,
          noBalls: innings.noBalls,
          byes: innings.byes,
          legByes: innings.legByes,
          penalties: innings.penalties,
          total: totalExtras,
        },
        batting,
        didNotBat,
        bowling,
        fallOfWickets,
        oversHistory: innings.overs.map((ov) => ({
          overNumber: ov.overNumber,
          bowlerId: ov.bowlerId,
          runsConceded: ov.runsConceded,
          wicketsCount: ov.wicketsCount,
          isMaiden: ov.isMaiden,
          balls: ov.balls.map((bl) => ({
            ballIndex: bl.ballIndex,
            runsBat: bl.runsBat,
            extraType: bl.extraType,
            extraRuns: bl.extraRuns,
            isLegal: bl.isLegal,
            isWicket: bl.isWicket,
            wicketType: bl.wicketType,
          })),
        })),
      };
    });

    // Ensure winner team name is in margin & heal player of the match to winning team
    if (match.result && match.result.winnerId) {
      const winnerTeam = match.teams.find((t) => t.teamId === match.result!.winnerId)?.team;
      if (winnerTeam) {
        let updatedMargin = match.result.margin || "";
        if (updatedMargin.toLowerCase().startsWith("won by")) {
          updatedMargin = `${winnerTeam.name} ${updatedMargin.charAt(0).toLowerCase() + updatedMargin.slice(1)}`;
          await prisma.matchResult.update({
            where: { id: match.result.id },
            data: { margin: updatedMargin, summary: updatedMargin },
          });
          match.result.margin = updatedMargin;
          match.result.summary = updatedMargin;
        }

        // Check if current POM belongs to losing team
        const currentPom = match.result.playerOfMatchId
          ? await prisma.player.findUnique({
              where: { id: match.result.playerOfMatchId },
              include: { team: true },
            })
          : null;

        if (!currentPom || currentPom.teamId !== match.result.winnerId) {
          const winningTopBatter = await prisma.batsmanInnings.findFirst({
            where: { innings: { matchId: match.id, battingTeamId: match.result.winnerId } },
            orderBy: { runs: "desc" },
          });
          const winningTopBowler = await prisma.bowlerInnings.findFirst({
            where: { innings: { matchId: match.id, bowlingTeamId: match.result.winnerId } },
            orderBy: [{ wickets: "desc" }, { runsConceded: "asc" }],
          });
          const betterPomId = winningTopBatter?.playerId || winningTopBowler?.playerId;
          if (betterPomId && betterPomId !== match.result.playerOfMatchId) {
            await prisma.matchResult.update({
              where: { id: match.result.id },
              data: { playerOfMatchId: betterPomId },
            });
            match.result.playerOfMatchId = betterPomId;
          }
        }
      }
    }

    // Player of Match details if available
    let playerOfMatch = null;
    if (match.result?.playerOfMatchId) {
      const pom = await prisma.player.findUnique({
        where: { id: match.result.playerOfMatchId },
        include: { team: true },
      });
      if (pom) {
        playerOfMatch = {
          id: pom.id,
          name: pom.name,
          team: pom.team.name,
          role: pom.role,
        };
      }
    }

    return NextResponse.json({
      match: {
        id: match.id,
        name: match.name,
        tournament: match.tournament,
        venue: match.venue,
        date: match.matchDate,
        format: match.format,
        oversLimit: match.oversLimit,
        ballType: match.ballType,
        status: match.status,
        tossWinnerId: match.tossWinnerId,
        tossDecision: match.tossDecision,
        teams: match.teams.map((mt) => mt.team),
        result: match.result,
        playerOfMatch,
      },
      innings: inningsScorecards,
    });
  } catch (error) {
    console.error("Scorecard fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch scorecard" }, { status: 500 });
  }
}
