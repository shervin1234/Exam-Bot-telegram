-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DEFAULT', 'ADMIN', 'PARTNER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "userid" BIGINT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DEFAULT',
    "languageCode" TEXT,
    "profilePicture" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3),
    "wallet" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_userid_key" ON "User"("userid");
