import type { PublishStatus, SceneGap, SceneKind } from "@/lib/api/contracts";

/*
  Copy for the content team's screens, where the Academy is built.

  Counts come from the API; this file holds the words around them, plurals
  included. The Academy belongs to no institution, so nothing here names one.
*/

/** "a", "a and b", "a, b and c". */
function listOf(items: string[]): string {
  return items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function counted(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export const authoringContent = {
  crumb: "Content",
  academyCrumb: "Academy",

  statuses: {
    DRAFT: "Draft",
    PUBLISHED: "Published",
    RETIRED: "Retired",
  } satisfies Record<PublishStatus, string>,
  archived: "Archived",

  pathways: {
    eyebrow: "Content",
    heading: "Academy content",
    description:
      "Build the Academy's modules and lessons, and fill each lesson with its videos and " +
      "notes. Learners see only what is published.",
    modules: (count: number, published: number) =>
      `${counted(count, "module", "modules")}, ${published} published`,
  },

  pathway: {
    modulesTitle: "Modules",
    modulesDescription: "In the order learners take them. Open one to add its lessons.",
    empty: "No modules yet. Add the first below.",
    lessons: (count: number, published: number) =>
      `${counted(count, "lesson", "lessons")}, ${published} published`,
    add: {
      title: "Add a module",
      description:
        "It starts as a draft at the end of the pathway. Learners don't see it until it's " +
        "published.",
      submit: "Add the module",
      busy: "Adding…",
    },
    archivedTitle: "Archived modules",
    archivedDescription: "Hidden from learners. Restoring one brings it back as a draft, at the end.",
  },

  module: {
    lessonsTitle: "Lessons",
    lessonsDescription: "In the order learners take them. Open one to add its scenes.",
    empty: "No lessons yet. Add the first below.",
    scenes: (count: number, ready: number) =>
      count === 0 ? "No scenes yet" : `${counted(count, "scene", "scenes")}, ${ready} ready`,
    add: {
      title: "Add a lesson",
      description:
        "It starts as a draft at the end of the module, with no scenes. Learners don't see " +
        "it until it's published.",
      submit: "Add the lesson",
      busy: "Adding…",
    },
    archivedTitle: "Archived lessons",
    archivedDescription: "Hidden from learners. Restoring one brings it back as a draft, at the end.",
  },

  details: {
    title: "Details",
    moduleDescription: "The module's name, and a line about it, as learners see them.",
    lessonDescription: "The lesson's name, and a line about it, as learners see them.",
    submit: "Save",
    busy: "Saving…",
    saved: "Saved.",
  },

  fields: {
    title: "Title",
    summary: "Summary",
    summaryHint: "Optional. One or two sentences about it.",
    requiredNote: "Fields marked * are required.",
  },

  move: {
    up: "Move up",
    down: "Move down",
    busy: "Moving…",
    movedUp: "Moved up.",
    movedDown: "Moved down.",
  },

  publishing: {
    title: "Publishing",
    draftModule:
      "Learners can't see this module yet. Publish it once at least one of its lessons is " +
      "published.",
    draftLesson:
      "Learners can't see this lesson yet. Publish it once every scene is complete.",
    publishedModule: "Learners can see this module and its published lessons.",
    publishedLesson:
      "Learners can see this lesson. Changes you save reach them straight away; a scene you " +
      "add stays hidden until it's complete.",
    publish: "Publish",
    publishing: "Publishing…",
    published: (title: string) => `“${title}” is published. Learners can see it now.`,
    unpublish: "Unpublish",
    unpublishing: "Unpublishing…",
    unpublishConsequence: (title: string) =>
      `Unpublish “${title}”? Learners stop seeing it straight away. Their progress is kept, ` +
      "and it comes back when you publish it again.",
    unpublished: (title: string) => `“${title}” is back to draft. Learners no longer see it.`,
  },

  archive: {
    title: "Archive",
    description:
      "Take it out of the Academy altogether. Nothing is deleted, and it can be restored.",
    label: "Archive",
    busy: "Archiving…",
    consequence: (title: string) =>
      `Archive “${title}”? Learners stop seeing it, and it moves to Archived. Their progress ` +
      "is kept, and you can restore it as a draft.",
    done: (title: string) => `“${title}” is archived.`,
    notice: "This is archived, so learners can't see it. Restore it to work on it again.",
    restore: "Restore",
    restoring: "Restoring…",
    restored: (title: string) => `“${title}” is restored as a draft.`,
  },

  lesson: {
    scenesTitle: "Scenes",
    scenesDescription:
      "The screens learners move through, in order: a video with its captions and still " +
      "image, or notes to read.",
    empty: "No scenes yet. Add the first below.",
    kinds: { VIDEO: "Video", NOTES: "Notes" } satisfies Record<SceneKind, string>,
    ready: "Ready",
    gapNames: {
      VIDEO: "the video",
      CAPTIONS: "captions",
      POSTER: "a still image",
      BODY: "its text",
    } satisfies Record<SceneGap, string>,
    needs: (gaps: string[]) => `Needs ${listOf(gaps)}`,
    viewInAcademy: "View in the Academy",
    add: {
      title: "Add a scene",
      description: "It's added at the end. Open it next to upload its files or write its notes.",
      kind: "Kind",
      videoHint: "A video with its captions and a still image.",
      notesHint: "Text to read.",
      submit: "Add the scene",
      busy: "Adding…",
    },
    remove: {
      label: "Remove",
      confirm: "Remove",
      busy: "Removing…",
      consequence: (title: string, kind: SceneKind) =>
        kind === "VIDEO"
          ? `Remove “${title}”? Its video, captions and still image are deleted, and this can't be undone.`
          : `Remove “${title}”? Its notes are deleted, and this can't be undone.`,
      done: (title: string) => `“${title}” is removed.`,
    },
  },
} as const;
