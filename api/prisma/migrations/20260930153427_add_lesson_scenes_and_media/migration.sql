-- CreateEnum
CREATE TYPE "LessonSceneKind" AS ENUM ('VIDEO', 'NOTES');

-- CreateEnum
CREATE TYPE "MediaPurpose" AS ENUM ('VIDEO', 'CAPTIONS', 'POSTER');

-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('PENDING', 'READY');

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PathwayModule" ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "LessonScene" (
    "id" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "kind" "LessonSceneKind" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "transcript" TEXT,
    "videoAssetId" UUID,
    "captionsAssetId" UUID,
    "posterAssetId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "sceneId" UUID NOT NULL,
    "purpose" "MediaPurpose" NOT NULL,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'PENDING',
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedById" UUID,
    "readyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneProgress" (
    "id" UUID NOT NULL,
    "enrolmentId" UUID NOT NULL,
    "sceneId" UUID NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SceneProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonScene_videoAssetId_key" ON "LessonScene"("videoAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonScene_captionsAssetId_key" ON "LessonScene"("captionsAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonScene_posterAssetId_key" ON "LessonScene"("posterAssetId");

-- CreateIndex
CREATE INDEX "LessonScene_lessonId_sequence_idx" ON "LessonScene"("lessonId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "MediaAsset_sceneId_purpose_status_idx" ON "MediaAsset"("sceneId", "purpose", "status");

-- CreateIndex
CREATE INDEX "SceneProgress_sceneId_idx" ON "SceneProgress"("sceneId");

-- CreateIndex
CREATE UNIQUE INDEX "SceneProgress_enrolmentId_sceneId_key" ON "SceneProgress"("enrolmentId", "sceneId");

-- AddForeignKey
ALTER TABLE "LessonScene" ADD CONSTRAINT "LessonScene_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonScene" ADD CONSTRAINT "LessonScene_videoAssetId_fkey" FOREIGN KEY ("videoAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonScene" ADD CONSTRAINT "LessonScene_captionsAssetId_fkey" FOREIGN KEY ("captionsAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonScene" ADD CONSTRAINT "LessonScene_posterAssetId_fkey" FOREIGN KEY ("posterAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "LessonScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneProgress" ADD CONSTRAINT "SceneProgress_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "Enrolment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneProgress" ADD CONSTRAINT "SceneProgress_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "LessonScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Whatever is already published has been since it was created, so its slug is
-- fixed from the start.
UPDATE "PathwayModule" SET "publishedAt" = "createdAt" WHERE "status" = 'PUBLISHED';
UPDATE "Lesson" SET "publishedAt" = "createdAt" WHERE "status" = 'PUBLISHED';
