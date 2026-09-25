import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting cricket database seed...");

  // Clean existing records
  await prisma.wicket.deleteMany();
  await prisma.ball.deleteMany();
  await prisma.over.deleteMany();
  await prisma.batsmanInnings.deleteMany();
  await prisma.bowlerInnings.deleteMany();
  await prisma.partnership.deleteMany();
  await prisma.innings.deleteMany();
  await prisma.playingXI.deleteMany();
  await prisma.matchTeam.deleteMany();
  await prisma.matchResult.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Default Demo User
  const hashedPassword = await bcrypt.hash("password123", 10);
  const demoUser = await prisma.user.create({
    data: {
      name: "Cricket Scorer Admin",
      email: "scorer@cricket.app",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("👤 Created demo user: scorer@cricket.app / password123");

  // 2. Create Teams
  const india = await prisma.team.create({
    data: {
      name: "India",
      shortName: "IND",
      color: "#1d4ed8",
      userId: demoUser.id,
    },
  });

  const australia = await prisma.team.create({
    data: {
      name: "Australia",
      shortName: "AUS",
      color: "#eab308",
      userId: demoUser.id,
    },
  });

  const england = await prisma.team.create({
    data: {
      name: "England",
      shortName: "ENG",
      color: "#dc2626",
      userId: demoUser.id,
    },
  });

  const pakistan = await prisma.team.create({
    data: {
      name: "Pakistan",
      shortName: "PAK",
      color: "#059669",
      userId: demoUser.id,
    },
  });

  console.log("🏏 Created 4 international teams: IND, AUS, ENG, PAK");

  // 3. Create Players for Each Team
  const indiaPlayersData = [
    { name: "Rohit Sharma", jerseyNumber: 45, role: "BATSMAN", battingStyle: "Right-hand bat" },
    { name: "Virat Kohli", jerseyNumber: 18, role: "BATSMAN", battingStyle: "Right-hand bat" },
    { name: "Suryakumar Yadav", jerseyNumber: 63, role: "BATSMAN", battingStyle: "Right-hand bat" },
    { name: "Rishabh Pant", jerseyNumber: 17, role: "WICKET_KEEPER", battingStyle: "Left-hand bat" },
    { name: "Hardik Pandya", jerseyNumber: 33, role: "ALL_ROUNDER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium" },
    { name: "Ravindra Jadeja", jerseyNumber: 8, role: "ALL_ROUNDER", battingStyle: "Left-hand bat", bowlingStyle: "Slow left-arm orthodox" },
    { name: "Axar Patel", jerseyNumber: 20, role: "ALL_ROUNDER", battingStyle: "Left-hand bat", bowlingStyle: "Slow left-arm orthodox" },
    { name: "Jasprit Bumrah", jerseyNumber: 93, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
    { name: "Kuldeep Yadav", jerseyNumber: 23, role: "BOWLER", battingStyle: "Left-hand bat", bowlingStyle: "Left-arm wrist spin" },
    { name: "Arshdeep Singh", jerseyNumber: 2, role: "BOWLER", battingStyle: "Left-hand bat", bowlingStyle: "Left-arm medium fast" },
    { name: "Mohammed Siraj", jerseyNumber: 73, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
    { name: "Shubman Gill", jerseyNumber: 77, role: "BATSMAN", battingStyle: "Right-hand bat" },
    { name: "Yashasvi Jaiswal", jerseyNumber: 64, role: "BATSMAN", battingStyle: "Left-hand bat" },
    { name: "Sanju Samson", jerseyNumber: 9, role: "WICKET_KEEPER", battingStyle: "Right-hand bat" },
    { name: "Mohammed Shami", jerseyNumber: 11, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
  ];

  const indPlayers: any = {};
  for (const p of indiaPlayersData) {
    const created = await prisma.player.create({
      data: { ...p, teamId: india.id },
    });
    indPlayers[p.name] = created;
  }

  const ausPlayersData = [
    { name: "Travis Head", jerseyNumber: 62, role: "BATSMAN", battingStyle: "Left-hand bat" },
    { name: "David Warner", jerseyNumber: 31, role: "BATSMAN", battingStyle: "Left-hand bat" },
    { name: "Mitchell Marsh", jerseyNumber: 8, role: "ALL_ROUNDER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium" },
    { name: "Glenn Maxwell", jerseyNumber: 32, role: "ALL_ROUNDER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off break" },
    { name: "Marcus Stoinis", jerseyNumber: 17, role: "ALL_ROUNDER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium" },
    { name: "Josh Inglis", jerseyNumber: 48, role: "WICKET_KEEPER", battingStyle: "Right-hand bat" },
    { name: "Pat Cummins", jerseyNumber: 30, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
    { name: "Mitchell Starc", jerseyNumber: 56, role: "BOWLER", battingStyle: "Left-hand bat", bowlingStyle: "Left-arm fast" },
    { name: "Adam Zampa", jerseyNumber: 88, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg break" },
    { name: "Josh Hazlewood", jerseyNumber: 38, role: "BOWLER", battingStyle: "Left-hand bat", bowlingStyle: "Right-arm fast medium" },
    { name: "Steve Smith", jerseyNumber: 49, role: "BATSMAN", battingStyle: "Right-hand bat" },
    { name: "Cameron Green", jerseyNumber: 42, role: "ALL_ROUNDER", battingStyle: "Right-hand bat" },
    { name: "Alex Carey", jerseyNumber: 4, role: "WICKET_KEEPER", battingStyle: "Left-hand bat" },
    { name: "Nathan Ellis", jerseyNumber: 12, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast medium" },
    { name: "Ashton Agar", jerseyNumber: 46, role: "ALL_ROUNDER", battingStyle: "Left-hand bat" },
  ];

  const ausPlayers: any = {};
  for (const p of ausPlayersData) {
    const created = await prisma.player.create({
      data: { ...p, teamId: australia.id },
    });
    ausPlayers[p.name] = created;
  }

  const engPlayersData = [
    { name: "Jos Buttler", jerseyNumber: 63, role: "WICKET_KEEPER", battingStyle: "Right-hand bat" },
    { name: "Phil Salt", jerseyNumber: 28, role: "BATSMAN", battingStyle: "Right-hand bat" },
    { name: "Harry Brook", jerseyNumber: 88, role: "BATSMAN", battingStyle: "Right-hand bat" },
    { name: "Jonny Bairstow", jerseyNumber: 51, role: "BATSMAN", battingStyle: "Right-hand bat" },
    { name: "Moeen Ali", jerseyNumber: 18, role: "ALL_ROUNDER", battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off break" },
    { name: "Liam Livingstone", jerseyNumber: 23, role: "ALL_ROUNDER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm spin" },
    { name: "Sam Curran", jerseyNumber: 58, role: "ALL_ROUNDER", battingStyle: "Left-hand bat", bowlingStyle: "Left-arm medium fast" },
    { name: "Jofra Archer", jerseyNumber: 22, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
    { name: "Adil Rashid", jerseyNumber: 95, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg break" },
    { name: "Mark Wood", jerseyNumber: 33, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
    { name: "Reece Topley", jerseyNumber: 38, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Left-arm fast medium" },
    { name: "Ben Stokes", jerseyNumber: 55, role: "ALL_ROUNDER", battingStyle: "Left-hand bat" },
    { name: "Joe Root", jerseyNumber: 66, role: "BATSMAN", battingStyle: "Right-hand bat" },
    { name: "Chris Jordan", jerseyNumber: 34, role: "BOWLER", battingStyle: "Right-hand bat" },
    { name: "Will Jacks", jerseyNumber: 85, role: "ALL_ROUNDER", battingStyle: "Right-hand bat" },
  ];

  const engPlayers: any = {};
  for (const p of engPlayersData) {
    const created = await prisma.player.create({
      data: { ...p, teamId: england.id },
    });
    engPlayers[p.name] = created;
  }

  const pakPlayersData = [
    { name: "Babar Azam", jerseyNumber: 56, role: "BATSMAN", battingStyle: "Right-hand bat" },
    { name: "Mohammad Rizwan", jerseyNumber: 16, role: "WICKET_KEEPER", battingStyle: "Right-hand bat" },
    { name: "Fakhar Zaman", jerseyNumber: 39, role: "BATSMAN", battingStyle: "Left-hand bat" },
    { name: "Saim Ayub", jerseyNumber: 63, role: "BATSMAN", battingStyle: "Left-hand bat" },
    { name: "Iftikhar Ahmed", jerseyNumber: 95, role: "ALL_ROUNDER", battingStyle: "Right-hand bat" },
    { name: "Shadab Khan", jerseyNumber: 7, role: "ALL_ROUNDER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg break" },
    { name: "Imad Wasim", jerseyNumber: 9, role: "ALL_ROUNDER", battingStyle: "Left-hand bat", bowlingStyle: "Slow left-arm orthodox" },
    { name: "Shaheen Afridi", jerseyNumber: 10, role: "BOWLER", battingStyle: "Left-hand bat", bowlingStyle: "Left-arm fast" },
    { name: "Naseem Shah", jerseyNumber: 71, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
    { name: "Haris Rauf", jerseyNumber: 150, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
    { name: "Mohammad Amir", jerseyNumber: 5, role: "BOWLER", battingStyle: "Left-hand bat", bowlingStyle: "Left-arm fast" },
    { name: "Usman Khan", jerseyNumber: 24, role: "BATSMAN", battingStyle: "Right-hand bat" },
    { name: "Aamer Jamal", jerseyNumber: 65, role: "ALL_ROUNDER", battingStyle: "Right-hand bat" },
    { name: "Abbas Afridi", jerseyNumber: 25, role: "BOWLER", battingStyle: "Right-hand bat" },
    { name: "Abrar Ahmed", jerseyNumber: 40, role: "BOWLER", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm mystery spin" },
  ];

  const pakPlayers: any = {};
  for (const p of pakPlayersData) {
    const created = await prisma.player.create({
      data: { ...p, teamId: pakistan.id },
    });
    pakPlayers[p.name] = created;
  }

  console.log("👥 Created 60 international players with full attributes");

  // 4. Create Completed Match 1: India vs Australia (T20 World Championship)
  const match1 = await prisma.match.create({
    data: {
      name: "T20 Championship Semi-Final: India vs Australia",
      tournament: "World T20 Cup",
      venue: "Melbourne Cricket Ground, Melbourne",
      matchDate: new Date("2024-06-24T19:00:00Z"),
      format: "T20",
      oversLimit: 20,
      ballType: "LEATHER",
      status: "COMPLETED",
      tossWinnerId: australia.id,
      tossDecision: "BAT",
      userId: demoUser.id,
    },
  });

  await prisma.matchTeam.createMany({
    data: [
      { matchId: match1.id, teamId: australia.id, captainId: ausPlayers["Mitchell Marsh"].id, wicketkeeperId: ausPlayers["Josh Inglis"].id },
      { matchId: match1.id, teamId: india.id, captainId: indPlayers["Rohit Sharma"].id, wicketkeeperId: indPlayers["Rishabh Pant"].id },
    ],
  });

  // Innings 1: Australia 178/6 (20.0 overs)
  const m1Innings1 = await prisma.innings.create({
    data: {
      matchId: match1.id,
      inningsNumber: 1,
      battingTeamId: australia.id,
      bowlingTeamId: india.id,
      totalRuns: 178,
      wickets: 6,
      legalBalls: 120,
      wides: 5,
      noBalls: 1,
      byes: 2,
      legByes: 4,
      isCompleted: true,
    },
  });

  // Batsmen for Australia
  const ausBattersData = [
    { playerId: ausPlayers["Travis Head"].id, battingOrder: 1, runs: 48, balls: 32, fours: 5, sixes: 2, strikeRate: 150.0, isOut: true, dismissalType: "CAUGHT" },
    { playerId: ausPlayers["David Warner"].id, battingOrder: 2, runs: 18, balls: 14, fours: 2, sixes: 0, strikeRate: 128.57, isOut: true, dismissalType: "BOWLED" },
    { playerId: ausPlayers["Mitchell Marsh"].id, battingOrder: 3, runs: 37, balls: 28, fours: 3, sixes: 2, strikeRate: 132.14, isOut: true, dismissalType: "CAUGHT" },
    { playerId: ausPlayers["Glenn Maxwell"].id, battingOrder: 4, runs: 54, balls: 29, fours: 4, sixes: 4, strikeRate: 186.21, isOut: true, dismissalType: "CAUGHT" },
    { playerId: ausPlayers["Marcus Stoinis"].id, battingOrder: 5, runs: 12, balls: 9, fours: 1, sixes: 0, strikeRate: 133.33, isOut: true, dismissalType: "RUN_OUT" },
    { playerId: ausPlayers["Josh Inglis"].id, battingOrder: 6, runs: 5, balls: 5, fours: 0, sixes: 0, strikeRate: 100.0, isOut: true, dismissalType: "LBW" },
    { playerId: ausPlayers["Pat Cummins"].id, battingOrder: 7, runs: 4, balls: 3, fours: 0, sixes: 0, strikeRate: 133.33, isOut: false },
  ];

  for (const b of ausBattersData) {
    await prisma.batsmanInnings.create({
      data: { ...b, inningsId: m1Innings1.id },
    });
  }

  // Bowlers for India
  const indBowlersData = [
    { playerId: indPlayers["Jasprit Bumrah"].id, legalBalls: 24, overs: 4.0, maidens: 1, runsConceded: 24, wickets: 3, economy: 6.0, dots: 14, wides: 1, noBalls: 0 },
    { playerId: indPlayers["Arshdeep Singh"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 38, wickets: 1, economy: 9.5, dots: 8, wides: 2, noBalls: 1 },
    { playerId: indPlayers["Kuldeep Yadav"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 32, wickets: 1, economy: 8.0, dots: 9, wides: 1, noBalls: 0 },
    { playerId: indPlayers["Axar Patel"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 35, wickets: 0, economy: 8.75, dots: 7, wides: 1, noBalls: 0 },
    { playerId: indPlayers["Hardik Pandya"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 43, wickets: 0, economy: 10.75, dots: 6, wides: 0, noBalls: 0 },
  ];

  for (const bw of indBowlersData) {
    await prisma.bowlerInnings.create({
      data: { ...bw, inningsId: m1Innings1.id },
    });
  }

  // Innings 2: India 182/4 (19.2 overs) - Target 179 chased!
  const m1Innings2 = await prisma.innings.create({
    data: {
      matchId: match1.id,
      inningsNumber: 2,
      battingTeamId: india.id,
      bowlingTeamId: australia.id,
      totalRuns: 182,
      wickets: 4,
      legalBalls: 116,
      targetRuns: 179,
      wides: 4,
      noBalls: 0,
      byes: 1,
      legByes: 3,
      isCompleted: true,
    },
  });

  const indBattersData = [
    { playerId: indPlayers["Rohit Sharma"].id, battingOrder: 1, runs: 38, balls: 24, fours: 4, sixes: 2, strikeRate: 158.33, isOut: true, dismissalType: "CAUGHT" },
    { playerId: indPlayers["Virat Kohli"].id, battingOrder: 2, runs: 72, balls: 48, fours: 6, sixes: 3, strikeRate: 150.0, isOut: false },
    { playerId: indPlayers["Rishabh Pant"].id, battingOrder: 3, runs: 15, balls: 11, fours: 1, sixes: 1, strikeRate: 136.36, isOut: true, dismissalType: "BOWLED" },
    { playerId: indPlayers["Suryakumar Yadav"].id, battingOrder: 4, runs: 24, balls: 16, fours: 3, sixes: 1, strikeRate: 150.0, isOut: true, dismissalType: "CAUGHT" },
    { playerId: indPlayers["Hardik Pandya"].id, battingOrder: 5, runs: 28, balls: 17, fours: 2, sixes: 2, strikeRate: 164.71, isOut: false },
  ];

  for (const b of indBattersData) {
    await prisma.batsmanInnings.create({
      data: { ...b, inningsId: m1Innings2.id },
    });
  }

  const ausBowlersData = [
    { playerId: ausPlayers["Mitchell Starc"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 42, wickets: 1, economy: 10.5, dots: 7, wides: 2, noBalls: 0 },
    { playerId: ausPlayers["Josh Hazlewood"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 32, wickets: 1, economy: 8.0, dots: 10, wides: 0, noBalls: 0 },
    { playerId: ausPlayers["Pat Cummins"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 36, wickets: 1, economy: 9.0, dots: 9, wides: 1, noBalls: 0 },
    { playerId: ausPlayers["Adam Zampa"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 38, wickets: 1, economy: 9.5, dots: 8, wides: 1, noBalls: 0 },
    { playerId: ausPlayers["Glenn Maxwell"].id, legalBalls: 20, overs: 3.2, maidens: 0, runsConceded: 30, wickets: 0, economy: 9.0, dots: 5, wides: 0, noBalls: 0 },
  ];

  for (const bw of ausBowlersData) {
    await prisma.bowlerInnings.create({
      data: { ...bw, inningsId: m1Innings2.id },
    });
  }

  // Add Match 1 Result
  await prisma.matchResult.create({
    data: {
      matchId: match1.id,
      winnerId: india.id,
      resultType: "WICKETS_WIN",
      margin: "Won by 6 wickets",
      summary: "India chased down 179 in a thrilling encounter led by Virat Kohli's unbeaten 72.",
      playerOfMatchId: indPlayers["Virat Kohli"].id,
      topScorerId: indPlayers["Virat Kohli"].id,
      bestBowlerId: indPlayers["Jasprit Bumrah"].id,
    },
  });

  console.log("🏆 Created Completed Match 1: IND vs AUS (IND won by 6 wickets)");

  // 5. Create Completed Match 2: England vs Pakistan (ODI / T20 Series)
  const match2 = await prisma.match.create({
    data: {
      name: "Lord's Trophy: England vs Pakistan",
      tournament: "Summer International Series",
      venue: "Lord's Cricket Ground, London",
      matchDate: new Date("2024-07-15T14:30:00Z"),
      format: "T20",
      oversLimit: 20,
      ballType: "LEATHER",
      status: "COMPLETED",
      tossWinnerId: england.id,
      tossDecision: "BAT",
      userId: demoUser.id,
    },
  });

  await prisma.matchTeam.createMany({
    data: [
      { matchId: match2.id, teamId: england.id, captainId: engPlayers["Jos Buttler"].id, wicketkeeperId: engPlayers["Jos Buttler"].id },
      { matchId: match2.id, teamId: pakistan.id, captainId: pakPlayers["Babar Azam"].id, wicketkeeperId: pakPlayers["Mohammad Rizwan"].id },
    ],
  });

  // Innings 1: England 195/5 (20.0 overs)
  const m2Innings1 = await prisma.innings.create({
    data: {
      matchId: match2.id,
      inningsNumber: 1,
      battingTeamId: england.id,
      bowlingTeamId: pakistan.id,
      totalRuns: 195,
      wickets: 5,
      legalBalls: 120,
      wides: 6,
      noBalls: 2,
      byes: 1,
      legByes: 2,
      isCompleted: true,
    },
  });

  const engBatters = [
    { playerId: engPlayers["Jos Buttler"].id, battingOrder: 1, runs: 65, balls: 38, fours: 7, sixes: 3, strikeRate: 171.05, isOut: true, dismissalType: "CAUGHT" },
    { playerId: engPlayers["Phil Salt"].id, battingOrder: 2, runs: 32, balls: 19, fours: 4, sixes: 1, strikeRate: 168.42, isOut: true, dismissalType: "BOWLED" },
    { playerId: engPlayers["Harry Brook"].id, battingOrder: 3, runs: 52, balls: 28, fours: 5, sixes: 2, strikeRate: 185.71, isOut: false },
    { playerId: engPlayers["Jonny Bairstow"].id, battingOrder: 4, runs: 24, balls: 16, fours: 2, sixes: 1, strikeRate: 150.0, isOut: true, dismissalType: "CAUGHT" },
    { playerId: engPlayers["Liam Livingstone"].id, battingOrder: 5, runs: 14, balls: 9, fours: 1, sixes: 1, strikeRate: 155.56, isOut: true, dismissalType: "CAUGHT" },
  ];

  for (const b of engBatters) {
    await prisma.batsmanInnings.create({
      data: { ...b, inningsId: m2Innings1.id },
    });
  }

  const pakBowlers = [
    { playerId: pakPlayers["Shaheen Afridi"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 34, wickets: 2, economy: 8.5, dots: 11, wides: 2, noBalls: 0 },
    { playerId: pakPlayers["Naseem Shah"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 38, wickets: 1, economy: 9.5, dots: 9, wides: 1, noBalls: 1 },
    { playerId: pakPlayers["Haris Rauf"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 45, wickets: 1, economy: 11.25, dots: 7, wides: 2, noBalls: 1 },
    { playerId: pakPlayers["Shadab Khan"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 42, wickets: 1, economy: 10.5, dots: 8, wides: 1, noBalls: 0 },
    { playerId: pakPlayers["Imad Wasim"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 32, wickets: 0, economy: 8.0, dots: 8, wides: 0, noBalls: 0 },
  ];

  for (const bw of pakBowlers) {
    await prisma.bowlerInnings.create({
      data: { ...bw, inningsId: m2Innings1.id },
    });
  }

  // Innings 2: Pakistan 188/8 (20.0 overs) - Defending 195, England wins by 7 runs!
  const m2Innings2 = await prisma.innings.create({
    data: {
      matchId: match2.id,
      inningsNumber: 2,
      battingTeamId: pakistan.id,
      bowlingTeamId: england.id,
      totalRuns: 188,
      wickets: 8,
      legalBalls: 120,
      targetRuns: 196,
      wides: 5,
      noBalls: 1,
      byes: 3,
      legByes: 2,
      isCompleted: true,
    },
  });

  const pakBatters = [
    { playerId: pakPlayers["Babar Azam"].id, battingOrder: 1, runs: 61, balls: 44, fours: 6, sixes: 1, strikeRate: 138.64, isOut: true, dismissalType: "CAUGHT" },
    { playerId: pakPlayers["Mohammad Rizwan"].id, battingOrder: 2, runs: 44, balls: 31, fours: 4, sixes: 1, strikeRate: 141.94, isOut: true, dismissalType: "BOWLED" },
    { playerId: pakPlayers["Fakhar Zaman"].id, battingOrder: 3, runs: 28, balls: 15, fours: 3, sixes: 2, strikeRate: 186.67, isOut: true, dismissalType: "CAUGHT" },
    { playerId: pakPlayers["Iftikhar Ahmed"].id, battingOrder: 4, runs: 20, balls: 12, fours: 1, sixes: 2, strikeRate: 166.67, isOut: true, dismissalType: "CAUGHT" },
    { playerId: pakPlayers["Shadab Khan"].id, battingOrder: 5, runs: 14, balls: 8, fours: 1, sixes: 1, strikeRate: 175.0, isOut: true, dismissalType: "RUN_OUT" },
  ];

  for (const b of pakBatters) {
    await prisma.batsmanInnings.create({
      data: { ...b, inningsId: m2Innings2.id },
    });
  }

  const engBowlers = [
    { playerId: engPlayers["Jofra Archer"].id, legalBalls: 24, overs: 4.0, maidens: 1, runsConceded: 28, wickets: 3, economy: 7.0, dots: 13, wides: 1, noBalls: 0 },
    { playerId: engPlayers["Sam Curran"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 40, wickets: 2, economy: 10.0, dots: 8, wides: 2, noBalls: 0 },
    { playerId: engPlayers["Adil Rashid"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 34, wickets: 1, economy: 8.5, dots: 9, wides: 1, noBalls: 0 },
    { playerId: engPlayers["Mark Wood"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 46, wickets: 2, economy: 11.5, dots: 8, wides: 1, noBalls: 1 },
    { playerId: engPlayers["Moeen Ali"].id, legalBalls: 24, overs: 4.0, maidens: 0, runsConceded: 38, wickets: 0, economy: 9.5, dots: 6, wides: 0, noBalls: 0 },
  ];

  for (const bw of engBowlers) {
    await prisma.bowlerInnings.create({
      data: { ...bw, inningsId: m2Innings2.id },
    });
  }

  await prisma.matchResult.create({
    data: {
      matchId: match2.id,
      winnerId: england.id,
      resultType: "RUNS_WIN",
      margin: "Won by 7 runs",
      summary: "England defended 195 behind Jos Buttler's 65 and Jofra Archer's death bowling mastery.",
      playerOfMatchId: engPlayers["Jos Buttler"].id,
      topScorerId: engPlayers["Jos Buttler"].id,
      bestBowlerId: engPlayers["Jofra Archer"].id,
    },
  });

  console.log("🏆 Created Completed Match 2: ENG vs PAK (ENG won by 7 runs)");

  // 6. Create Match 3: LIVE Match (India vs Pakistan in Asia Cup Final) ready for interactive scoring!
  const liveMatch = await prisma.match.create({
    data: {
      name: "Asia Cup Final: India vs Pakistan",
      tournament: "Asia Cup",
      venue: "Dubai International Stadium",
      matchDate: new Date(),
      format: "T20",
      oversLimit: 20,
      ballType: "LEATHER",
      status: "LIVE",
      tossWinnerId: india.id,
      tossDecision: "BAT",
      userId: demoUser.id,
    },
  });

  await prisma.matchTeam.createMany({
    data: [
      { matchId: liveMatch.id, teamId: india.id, captainId: indPlayers["Rohit Sharma"].id, wicketkeeperId: indPlayers["Rishabh Pant"].id },
      { matchId: liveMatch.id, teamId: pakistan.id, captainId: pakPlayers["Babar Azam"].id, wicketkeeperId: pakPlayers["Mohammad Rizwan"].id },
    ],
  });

  // Assign Playing XI for India
  const indXI = [
    indPlayers["Rohit Sharma"], indPlayers["Virat Kohli"], indPlayers["Suryakumar Yadav"],
    indPlayers["Rishabh Pant"], indPlayers["Hardik Pandya"], indPlayers["Ravindra Jadeja"],
    indPlayers["Axar Patel"], indPlayers["Jasprit Bumrah"], indPlayers["Kuldeep Yadav"],
    indPlayers["Arshdeep Singh"], indPlayers["Mohammed Siraj"],
  ];

  for (let i = 0; i < indXI.length; i++) {
    await prisma.playingXI.create({
      data: {
        matchId: liveMatch.id,
        teamId: india.id,
        playerId: indXI[i].id,
        battingPosition: i + 1,
        isCaptain: indXI[i].name === "Rohit Sharma",
        isWicketKeeper: indXI[i].name === "Rishabh Pant",
      },
    });
  }

  // Assign Playing XI for Pakistan
  const pakXI = [
    pakPlayers["Babar Azam"], pakPlayers["Mohammad Rizwan"], pakPlayers["Fakhar Zaman"],
    pakPlayers["Saim Ayub"], pakPlayers["Iftikhar Ahmed"], pakPlayers["Shadab Khan"],
    pakPlayers["Imad Wasim"], pakPlayers["Shaheen Afridi"], pakPlayers["Naseem Shah"],
    pakPlayers["Haris Rauf"], pakPlayers["Mohammad Amir"],
  ];

  for (let i = 0; i < pakXI.length; i++) {
    await prisma.playingXI.create({
      data: {
        matchId: liveMatch.id,
        teamId: pakistan.id,
        playerId: pakXI[i].id,
        battingPosition: i + 1,
        isCaptain: pakXI[i].name === "Babar Azam",
        isWicketKeeper: pakXI[i].name === "Mohammad Rizwan",
      },
    });
  }

  // Active 1st innings with Rohit and Kohli ready, Shaheen bowling!
  const liveInnings = await prisma.innings.create({
    data: {
      matchId: liveMatch.id,
      inningsNumber: 1,
      battingTeamId: india.id,
      bowlingTeamId: pakistan.id,
      totalRuns: 16,
      wickets: 0,
      legalBalls: 6,
      currentStrikerId: indPlayers["Virat Kohli"].id,
      currentNonStrikerId: indPlayers["Rohit Sharma"].id,
      currentBowlerId: pakPlayers["Naseem Shah"].id,
    },
  });

  // Over 1 (Shaheen Afridi)
  const over1 = await prisma.over.create({
    data: {
      inningsId: liveInnings.id,
      overNumber: 1,
      legalBallsCount: 6,
      totalBallsCount: 6,
      runsConceded: 16,
      wicketsCount: 0,
      isMaiden: false,
      bowlerId: pakPlayers["Shaheen Afridi"].id,
    },
  });

  // Record 6 balls of over 1
  const over1Balls = [
    { runsBat: 4, isBoundary: true, batsmanId: indPlayers["Rohit Sharma"].id, nonStrikerId: indPlayers["Virat Kohli"].id },
    { runsBat: 1, batsmanId: indPlayers["Rohit Sharma"].id, nonStrikerId: indPlayers["Virat Kohli"].id },
    { runsBat: 0, batsmanId: indPlayers["Virat Kohli"].id, nonStrikerId: indPlayers["Rohit Sharma"].id },
    { runsBat: 6, isSix: true, batsmanId: indPlayers["Virat Kohli"].id, nonStrikerId: indPlayers["Rohit Sharma"].id },
    { runsBat: 4, isBoundary: true, batsmanId: indPlayers["Virat Kohli"].id, nonStrikerId: indPlayers["Rohit Sharma"].id },
    { runsBat: 1, batsmanId: indPlayers["Virat Kohli"].id, nonStrikerId: indPlayers["Rohit Sharma"].id },
  ];

  for (let i = 0; i < over1Balls.length; i++) {
    const b = over1Balls[i];
    await prisma.ball.create({
      data: {
        inningsId: liveInnings.id,
        overId: over1.id,
        ballIndex: i,
        legalBallNumber: i + 1,
        batsmanId: b.batsmanId,
        nonStrikerId: b.nonStrikerId,
        bowlerId: pakPlayers["Shaheen Afridi"].id,
        runsBat: b.runsBat,
        isBoundary: b.isBoundary || false,
        isSix: b.isSix || false,
      },
    });
  }

  // Batsmen and Bowler entries for Live Match
  await prisma.batsmanInnings.create({
    data: {
      inningsId: liveInnings.id,
      playerId: indPlayers["Rohit Sharma"].id,
      battingOrder: 1,
      runs: 5,
      balls: 2,
      fours: 1,
      sixes: 0,
      strikeRate: 250.0,
    },
  });

  await prisma.batsmanInnings.create({
    data: {
      inningsId: liveInnings.id,
      playerId: indPlayers["Virat Kohli"].id,
      battingOrder: 2,
      runs: 11,
      balls: 4,
      fours: 1,
      sixes: 1,
      strikeRate: 275.0,
    },
  });

  await prisma.bowlerInnings.create({
    data: {
      inningsId: liveInnings.id,
      playerId: pakPlayers["Shaheen Afridi"].id,
      legalBalls: 6,
      overs: 1.0,
      maidens: 0,
      runsConceded: 16,
      wickets: 0,
      economy: 16.0,
      dots: 1,
    },
  });

  console.log(`🔥 Created LIVE Interactive Match: IND vs PAK (Score: 16/0 after 1.0 ov) - ID: ${liveMatch.id}`);
  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
