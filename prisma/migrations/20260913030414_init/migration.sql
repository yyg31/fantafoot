-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "clubName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "budget" REAL NOT NULL DEFAULT 220
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "l1Club" TEXT NOT NULL,
    "startValue" REAL NOT NULL,
    "currentValue" REAL NOT NULL,
    "totalPoints" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SquadPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SquadPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SquadPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SquadLock" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Matchday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "deadline" DATETIME NOT NULL,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Lineup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auto" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Lineup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lineup_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "Matchday" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LineupSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lineupId" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    CONSTRAINT "LineupSlot_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "Lineup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LineupSlot_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "Matchday" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LineupSlot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayerMatchdayStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "penaltyGoals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "goalsConceded" INTEGER,
    "points" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "PlayerMatchdayStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlayerMatchdayStat_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "Matchday" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamMatchdayResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "l1Club" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "goalsConceded" INTEGER NOT NULL,
    CONSTRAINT "TeamMatchdayResult_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "Matchday" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClubMatchdayScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "points" REAL NOT NULL,
    CONSTRAINT "ClubMatchdayScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClubMatchdayScore_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "Matchday" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Player_l1Club_idx" ON "Player"("l1Club");

-- CreateIndex
CREATE INDEX "Player_position_idx" ON "Player"("position");

-- CreateIndex
CREATE INDEX "SquadPlayer_userId_idx" ON "SquadPlayer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SquadPlayer_userId_playerId_key" ON "SquadPlayer"("userId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Matchday_number_key" ON "Matchday"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Lineup_userId_matchdayId_key" ON "Lineup"("userId", "matchdayId");

-- CreateIndex
CREATE UNIQUE INDEX "LineupSlot_lineupId_playerId_key" ON "LineupSlot"("lineupId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerMatchdayStat_playerId_matchdayId_key" ON "PlayerMatchdayStat"("playerId", "matchdayId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMatchdayResult_l1Club_matchdayId_key" ON "TeamMatchdayResult"("l1Club", "matchdayId");

-- CreateIndex
CREATE INDEX "ClubMatchdayScore_userId_idx" ON "ClubMatchdayScore"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMatchdayScore_userId_matchdayId_key" ON "ClubMatchdayScore"("userId", "matchdayId");
