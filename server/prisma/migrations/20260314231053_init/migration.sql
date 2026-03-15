-- CreateEnum
CREATE TYPE "InkColor" AS ENUM ('AMBER', 'AMETHYST', 'EMERALD', 'RUBY', 'SAPPHIRE', 'STEEL');

-- CreateEnum
CREATE TYPE "Format" AS ENUM ('BO1', 'BO3', 'BO5');

-- CreateEnum
CREATE TYPE "TopCut" AS ENUM ('TOP32', 'TOP16', 'TOP8', 'NONE');

-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('WIN', 'LOSS', 'DRAW');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "playerCount" INTEGER,
    "swissRounds" INTEGER NOT NULL,
    "topCut" "TopCut" NOT NULL DEFAULT 'NONE',
    "format" "Format" NOT NULL DEFAULT 'BO1',
    "myDeckColors" "InkColor"[],
    "placement" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "isTopCut" BOOLEAN NOT NULL DEFAULT false,
    "opponentName" TEXT,
    "opponentDeckColors" "InkColor"[],
    "myScore" INTEGER NOT NULL DEFAULT 0,
    "opponentScore" INTEGER NOT NULL DEFAULT 0,
    "result" "MatchResult" NOT NULL,
    "wentFirst" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "tournaments_userId_idx" ON "tournaments"("userId");

-- CreateIndex
CREATE INDEX "matches_tournamentId_idx" ON "matches"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_tournamentId_roundNumber_isTopCut_key" ON "matches"("tournamentId", "roundNumber", "isTopCut");

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
