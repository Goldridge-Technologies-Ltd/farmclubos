-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "platformRole" "PlatformRole",
ALTER COLUMN "institutionId" DROP NOT NULL,
ALTER COLUMN "role" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Invite_platformRole_email_idx" ON "Invite"("platformRole", "email");

-- Every invitation is for exactly one thing: a place in an institution, with
-- its role, or a place on the content team. Only CONTENT_MANAGER is granted
-- by invitation; making someone a platform administrator stays a deliberate
-- step outside it. "IS NOT NULL" is spelled out because a check passes when
-- its expression is NULL, as a bare comparison with NULL would be.
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_one_target" CHECK (
  ("institutionId" IS NOT NULL AND "role" IS NOT NULL AND "platformRole" IS NULL)
  OR (
    "institutionId" IS NULL AND "role" IS NULL
    AND "platformRole" IS NOT NULL AND "platformRole" = 'CONTENT_MANAGER'
  )
);
