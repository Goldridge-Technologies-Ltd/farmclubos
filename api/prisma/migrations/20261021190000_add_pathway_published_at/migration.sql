-- A pathway's slug now follows its title until it is first published, as a
-- module's and a lesson's do, so it records when that was.
ALTER TABLE "Pathway" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- A pathway already published keeps its slug: links to it are out there.
UPDATE "Pathway" SET "publishedAt" = "createdAt" WHERE "status" = 'PUBLISHED';
