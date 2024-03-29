-- CreateEnum
CREATE TYPE "SheetStatus" AS ENUM ('PROCESSING', 'FAILED', 'SUCCESS');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXTREME');

-- CreateEnum
CREATE TYPE "Key" AS ENUM ('A_MAJOR', 'A_MINOR', 'B_FLAT_MAJOR', 'B_FLAT_MINOR', 'B_MAJOR', 'B_MINOR', 'C_MAJOR', 'C_MINOR', 'D_FLAT_MAJOR', 'D_FLAT_MINOR', 'D_MAJOR', 'D_MINOR', 'E_FLAT_MAJOR', 'E_FLAT_MINOR', 'E_MAJOR', 'E_MINOR', 'F_MAJOR', 'F_MINOR', 'G_FLAT_MAJOR', 'G_FLAT_MINOR', 'G_MAJOR', 'G_MINOR', 'A_FLAT_MAJOR', 'A_FLAT_MINOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bio" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sheet" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "tempo" INTEGER NOT NULL DEFAULT 120,
    "composer" TEXT,
    "date" TIMESTAMP(3),
    "key" "Key",
    "difficulty" "Difficulty",
    "status" "SheetStatus" NOT NULL DEFAULT 'PROCESSING',

    CONSTRAINT "Sheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetXML" (
    "id" TEXT NOT NULL,
    "metaId" TEXT NOT NULL,
    "xml" XML NOT NULL,

    CONSTRAINT "SheetXML_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Sheet_id_key" ON "Sheet"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SheetXML_id_key" ON "SheetXML"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SheetXML_metaId_key" ON "SheetXML"("metaId");

-- AddForeignKey
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetXML" ADD CONSTRAINT "SheetXML_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "Sheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
