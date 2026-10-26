-- CreateEnum
CREATE TYPE "InstitutionKind" AS ENUM ('STANDARD', 'INDEPENDENT_LEARNERS');

-- AlterTable
ALTER TABLE "Cohort" ADD COLUMN     "selfPaced" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "kind" "InstitutionKind" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "invitedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);

-- There is one home for people who sign up on their own. The API makes it the
-- first time someone needs it, so two requests racing to make it must not end
-- with two; the loser re-reads the winner's. Prisma leaves partial indexes
-- alone, as it does the Invite_one_target check.
CREATE UNIQUE INDEX "Institution_one_independent_learners_home" ON "Institution" ("kind")
WHERE "kind" = 'INDEPENDENT_LEARNERS';

-- Each pathway has one self-paced cohort, made when its first independent
-- learner starts it, for the same reason.
CREATE UNIQUE INDEX "Cohort_one_self_paced_per_pathway" ON "Cohort" ("pathwayId")
WHERE "selfPaced";
