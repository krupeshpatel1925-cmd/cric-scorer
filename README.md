# 🏏 Cricket Scorer Pro — Production-Ready Cricket Scoring & Analytics Engine

A complete, modern, production-ready Cricket Scoring web application designed for scoring and managing cricket matches with professional sports aesthetics, live ball-by-ball calculations, strike rotation, wicket workflows, undo & edit ball capabilities, match history, comprehensive player/team analytics, PWA offline scoring with auto-sync, and authentication.

---

## 🌟 Key Features

1. **One-Touch Live Scoring Pad**:
   - High-contrast responsive buttons for runs (`0`, `1`, `2`, `3`, `4`, `5`, `6`).
   - Extras: Wide, No-Ball, Bye, Leg-Bye, Penalty (+5).
   - Wicket modal covering all dismissal types (Bowled, Caught with fielder, LBW, Run-out with striker/non-striker and completed runs, Stumped, Hit Wicket, Retired Hurt, Retired Out).
   - Instant Strike Rotation handling odd/even runs, boundaries, overs, and wickets.
   - Dynamic over timeline displaying legal-ball counters and visual ball badges (`1`, `4`, `Wd`, `Nb`, `W`, `6`).

2. **Live Match Scoreboard**:
   - Sticky header with Total Runs, Wickets, Overs, Current Run Rate (CRR).
   - 2nd Innings Target Tracker: Target, Runs Needed, Balls Remaining, Required Run Rate (RRR).
   - Active Batsmen card highlighting striker (`*`), runs, balls, 4s, 6s, strike rate, and partnership.
   - Current Bowler card with overs, maidens, runs conceded, wickets, and economy rate.

3. **Multi-Level Undo & Reversible Engine**:
   - Pop any recorded ball to roll back runs, extras, wickets, bowler stats, batsman scores, and restore previous striker/non-striker positions accurately.

4. **Tie & Super Over Support**:
   - Detects match ties automatically at the conclusion of the 2nd innings.
   - Prompts for Super Over, allowing nomination of 2 batsmen and 1 bowler for the decisive 6-ball clash.

5. **Team & Player Roster Management**:
   - Create, edit, and manage teams with custom jersey colors and short codes.
   - Squad rosters with player jersey numbers, roles (Batsman, Bowler, All-Rounder, Wicketkeeper), batting styles, and bowling styles.
   - Designation of Captains and Wicketkeepers.

6. **Match Setup Wizard**:
   - 3-step setup: Match format (T20, ODI, Custom Overs), venue, ball type (Leather/Tennis), Playing XI squads, toss winner & toss decision (Bat/Bowl), and opening lineup selection.

7. **Full Scorecard & Archives**:
   - Detailed batting table with dismissal notes, strike rates, and Did Not Bat lists.
   - Bowling figures table with overs, maidens, runs, wickets, economy, and dot balls.
   - Extras breakdown (`wd`, `nb`, `b`, `lb`, `p`) and Fall of Wickets timeline.
   - Player of the Match auto-suggestion and manual selection.

8. **Statistics & Leaderboards**:
   - Player batting leaderboards (Runs, Average, Strike Rate, Highest Score, 50s, 100s, 4s, 6s).
   - Bowling leaderboards (Wickets, Economy, Average, Overs, Best Bowling).
   - Team standings with matches played, won, lost, ties, win percentage, and high/low totals.

9. **Offline PWA Capability**:
   - Offline-first scoring queue in local storage with automatic synchronization when network reconnects.
   - Mobile bottom navigation bar and touch-optimized controls for phones and tablets.

---

## 🏗️ Technology Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend**: Next.js Server Components & Route Handlers (REST APIs).
- **ORM & Database**: Prisma ORM with SQLite for instant zero-configuration local runs (plug-and-play PostgreSQL support via `.env` configuration).
- **Authentication**: Email/Password authentication with `bcryptjs` password hashing and secure HTTP-only JWT cookies.
- **Scoring Engine**: Pure functional TypeScript calculation engine (`lib/scoring/engine.ts`).

---

## 🗄️ Database Schema Models

The database schema in `prisma/schema.prisma` implements all 14 domain models:

| Model | Description |
| :--- | :--- |
| `User` | User accounts with email/password authentication and roles |
| `Team` | Club and international teams (name, short name, color, stats) |
| `Player` | Player profiles (jersey number, role, batting/bowling style) |
| `Match` | Match fixtures (name, tournament, venue, format, overs, toss) |
| `MatchTeam` | Match-specific team details including Captain and Wicketkeeper |
| `PlayingXI` | 11-player squad selection for each match |
| `Innings` | Innings score tracking (total runs, wickets, legal balls, extras) |
| `Over` | Over-by-over aggregates (legal balls, runs conceded, maidens) |
| `Ball` | Every single ball recorded with runs, extras, wickets, and bowler |
| `BatsmanInnings` | Individual batting figures (runs, balls, 4s, 6s, strike rate, dismissal) |
| `BowlerInnings` | Individual bowling figures (overs, maidens, runs, wickets, economy, dots) |
| `Wicket` | Comprehensive dismissal records (type, bowler, fielder, runs completed) |
| `Partnership` | Batting partnerships per wicket |
| `MatchResult` | Match outcome (winner, margin, Player of the Match, top performers) |

---

## 🚀 Quick Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
# Default SQLite for instant local execution
DATABASE_URL="file:./dev.db"
JWT_SECRET="cricket_super_secret_jwt_key_2024_secure_scoring_app"
NEXTAUTH_URL="http://localhost:3000"
```

> **For PostgreSQL in production**:
> Update the datasource provider in `prisma/schema.prisma` from `sqlite` to `postgresql`, and set:
> ```env
> DATABASE_URL="postgresql://postgres:password@localhost:5432/cricket_scorer?schema=public"
> ```

### 3. Initialize Database & Run Seed Data
```bash
# Push database schema
npx prisma db push

# Seed sample data (India, Australia, England, Pakistan, 60 players, 2 completed matches, 1 live match)
npm run db:seed
```

### 4. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Default Demo Credentials

You can sign in with one click using the **"⚡ Quick Demo Admin Login"** button on the `/login` page or with:
- **Email**: `scorer@cricket.app`
- **Password**: `password123`

---

## 🧪 Automated Unit Tests

Run the pure cricket scoring engine test suite verifying all 17 cricket calculation scenarios:
```bash
npm run test
```

### Tested Scenarios:
1. Normal runs calculation (0, 1, 2, 3, 4, 6)
2. Boundaries (4s, 6s attribution)
3. Wides (1 extra run, bowler charged, non-legal ball, not faced by batsman)
4. No-balls (1 extra run + bat runs, non-legal ball)
5. Byes & Leg-byes (runs to team total, legal ball, not charged to bowler)
6. Wickets (Bowled, Caught, LBW, Stumped credited to bowler)
7. Run-outs (striker vs non-striker dismissal, completed runs count, bowler not charged)
8. Strike rotation on odd runs (1, 3, 5)
9. Strike rotation on over completion (6 legal balls)
10. Strike retention on boundary (4, 6)
11. Bowler over completion & maiden over detection (6 legal balls, 0 runs conceded)
12. Innings completion when 10 wickets fall (All Out)
13. Innings completion when target reached in 2nd innings
14. Target, Run Rate, and Required Run Rate formulas
15. Batsman strike rate & Bowler economy formulas
16. Undo operation restores state accurately
17. Super Over 6-ball logic & tie resolution

---

## 🌐 API Reference

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Sign in and receive session cookie
- `POST /api/auth/logout` — Clear session cookie
- `GET /api/auth/me` — Get currently authenticated user

### Teams & Players
- `GET /api/teams` — List all teams with stats
- `POST /api/teams` — Create a new team
- `GET /api/teams/:id` — Get team details & squad roster
- `PUT /api/teams/:id` — Update team details
- `DELETE /api/teams/:id` — Delete team
- `GET /api/players` — Search players (with optional `teamId` filter)
- `POST /api/players` — Add a new player to squad
- `GET /api/players/:id` — Get player details and career figures
- `PUT /api/players/:id` — Update player
- `DELETE /api/players/:id` — Delete player

### Matches & Live Scoring
- `GET /api/matches` — List matches (with search, status, format filters)
- `POST /api/matches` — Create match wizard setup
- `GET /api/matches/:id` — Full match details & active innings
- `PUT /api/matches/:id` — Update match metadata
- `DELETE /api/matches/:id` — Delete match
- `POST /api/matches/:id/ball` — Record a ball with runs, extras, and strike rotation
- `POST /api/matches/:id/wicket` — Record wicket dismissal modal outcome
- `POST /api/matches/:id/undo` — Undo last ball and roll back state
- `POST /api/matches/:id/change-strike` — Manually swap striker & non-striker
- `POST /api/matches/:id/change-bowler` — Select next bowler for over
- `POST /api/matches/:id/end-innings` — Conclude innings or match
- `POST /api/matches/:id/super-over` — Initiate Super Over
- `GET /api/matches/:id/scorecard` — Complete match scorecard with fall of wickets

### Statistics
- `GET /api/statistics/players` — Batting & Bowling player rankings
- `GET /api/statistics/teams` — Team standings & win rates

---

## 🚢 Production Deployment

1. **Build the Next.js Production Bundle**:
   ```bash
   npm run build
   ```
2. **Start the Production Server**:
   ```bash
   npm run start
   ```
3. **Deploying on Vercel / Railway / Docker**:
   - Set environment variables `DATABASE_URL` and `JWT_SECRET`.
   - On build step, run `npx prisma db push && npm run build`.
"# cric-scorer" 
