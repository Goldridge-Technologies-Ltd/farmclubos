-- AlterTable
ALTER TABLE "AuthSession" ADD COLUMN     "activeInstitutionId" UUID;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_activeInstitutionId_fkey" FOREIGN KEY ("activeInstitutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
