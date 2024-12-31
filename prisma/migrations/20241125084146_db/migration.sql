-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referrerId" BIGINT;

-- CreateTable
CREATE TABLE "Invite" (
    "id" SERIAL NOT NULL,
    "inviterId" BIGINT NOT NULL,
    "invitedId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("userid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedId_fkey" FOREIGN KEY ("invitedId") REFERENCES "User"("userid") ON DELETE RESTRICT ON UPDATE CASCADE;
