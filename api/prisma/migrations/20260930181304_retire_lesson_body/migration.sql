-- A lesson's text now lives in its scenes, so Lesson.body goes. The app never
-- wrote it (the seed leaves it null), but any text put there by hand is kept:
-- it becomes the lesson's last scene, as notes, before the column is dropped.
-- A notes scene with text is complete, so learners go on seeing it.
INSERT INTO "LessonScene" ("id", "lessonId", "kind", "sequence", "title", "body", "updatedAt")
SELECT
    gen_random_uuid(),
    l."id",
    'NOTES'::"LessonSceneKind",
    COALESCE((SELECT MAX(s."sequence") FROM "LessonScene" s WHERE s."lessonId" = l."id"), 0) + 1,
    l."title",
    btrim(l."body"),
    CURRENT_TIMESTAMP
FROM "Lesson" l
WHERE btrim(l."body") <> '';

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "body";
