import type { MediaPurpose, PublishStatus, SceneGap, SceneKind } from "@/lib/api/contracts";

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
      "Build the Academy: its pathways, their modules and lessons, and each lesson's videos " +
      "and notes. Learners see only what is published.",
    modules: (count: number, published: number) =>
      `${counted(count, "module", "modules")}, ${published} published`,
    listTitle: "Pathways",
    listDescription: "In the order the Academy lists them. Open one to add its modules.",
    empty: "No pathways yet. Add the first below.",
    add: {
      title: "Add a pathway",
      description:
        "It starts as a draft at the end of the Academy. Learners and institutions don't see " +
        "it until it's published.",
      submit: "Add the pathway",
      busy: "Adding…",
    },
    archivedTitle: "Archived pathways",
    archivedDescription:
      "Hidden from learners and institutions. Restoring one brings it back as a draft, at the end.",
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
    pathwayDescription:
      "The pathway's name, level and summary as the Academy lists them, and a longer " +
      "description for its own page.",
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

  /** A pathway's own fields, beyond a title: the Academy lists every pathway by its summary. */
  pathwayFields: {
    summaryHint: "One or two sentences, shown where the Academy lists pathways.",
    level: "Level",
    description: "Description",
    descriptionHint: "Optional. Shown on the pathway's own page.",
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
    draftPathway:
      "Learners and institutions can't see this pathway yet. Publish it once at least one of " +
      "its modules is published.",
    publishedPathway:
      "Learners can see this pathway and its published modules, and institutions can open " +
      "cohorts on it. While anyone is part-way through it, it can't be unpublished or archived.",
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
      "The screens learners move through, in order: a video with its still image, and " +
      "captions if you have them, or notes to read.",
    empty: "No scenes yet. Add the first below.",
    kinds: { VIDEO: "Video", NOTES: "Notes" } satisfies Record<SceneKind, string>,
    ready: "Ready",
    gapNames: {
      VIDEO: "the video",
      POSTER: "a still image",
      BODY: "its text",
    } satisfies Record<SceneGap, string>,
    needs: (gaps: string[]) => `Needs ${listOf(gaps)}`,
    viewInAcademy: "View in the Academy",
    preview: "Preview the lesson",
    add: {
      title: "Add a scene",
      description: "It's added at the end. Open it next to upload its files or write its notes.",
      kind: "Kind",
      videoHint: "A video with a still image, and captions if you have them.",
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
          ? `Remove “${title}”? Its video, still image and any captions are deleted, and this can't be undone.`
          : `Remove “${title}”? Its notes are deleted, and this can't be undone.`,
      done: (title: string) => `“${title}” is removed.`,
    },
  },

  /** The whole lesson as learners will see it, scene by scene. */
  preview: {
    crumb: "Preview",
    eyebrow: "Lesson preview",
    loading: "Loading the preview",
    about:
      "This is the lesson as learners see it, one scene at a time. Nothing here is recorded " +
      "as progress.",
    empty: "This lesson has no scenes yet, so there's nothing to preview. Add one on the lesson's page.",
    notReady: {
      title: "Not ready",
      description: (gaps: string[]) => `Learners won't see this scene until it has ${listOf(gaps)}.`,
      edit: "Edit the scene",
    },
    finish: "Finish the preview",
  },

  scene: {
    backToLesson: "Back to the lesson",
    files: {
      title: "Files",
      description:
        "A video scene needs its video and a still image before learners can see it. " +
        "Captions are optional.",
    },
    slots: {
      VIDEO: {
        label: "Video",
        hint: "An MP4 (H.264 video, AAC audio) up to 1 GB. Scenes work best at 30 to 90 seconds.",
      },
      CAPTIONS: {
        label: "Captions",
        hint:
          "Optional. A WebVTT (.vtt) file of everything said, up to 1 MB. With it, learners " +
          "get captions and a transcript.",
      },
      POSTER: {
        label: "Still image",
        hint:
          "A JPG, PNG or WebP up to 5 MB, ideally 16:9. It shows before the video plays, " +
          "and in its place on a slow connection.",
      },
    } satisfies Record<MediaPurpose, { label: string; hint: string }>,
    expected: {
      VIDEO: "an MP4 video",
      CAPTIONS: "a WebVTT captions file (.vtt)",
      POSTER: "a JPG, PNG or WebP image",
    } satisfies Record<MediaPurpose, string>,
    current: (name: string, size: string, date: string) => `${name} · ${size} · uploaded ${date}`,
    none: "Not uploaded yet.",
    choose: (label: string) => `Choose the ${label.toLowerCase()} file`,
    upload: "Upload",
    replace: "Upload a replacement",
    progress: (name: string) => `Uploading ${name}`,
    checking: "Checking the file…",
    uploaded: (name: string) => `${name} is uploaded.`,
    wrongType: (expected: string) => `That file isn't ${expected}.`,
    tooLarge: (size: string, max: string) => `That file is ${size}; this takes up to ${max}.`,
    interrupted:
      "The upload didn't finish. Check your connection, then choose the file and upload it again.",
    preview: {
      title: "Preview",
      description: "As learners see it, with captions and a transcript when it has captions.",
      waiting: "The preview appears once the video is uploaded.",
    },
    details: {
      title: "Details",
      videoDescription: "The scene's title, and any short lines to show under the video.",
      notesDescription: "The scene's title and its notes.",
    },
    fields: {
      supportingText: "Supporting text",
      supportingHint:
        "Optional. One to three short lines under the video; the narration carries the detail.",
      notes: "Notes",
      notesHint:
        "Use the buttons, or type ## for a heading, **bold**, _italic_, - for a list, " +
        "1. for a numbered list and [words](https://…) for a link.",
    },
    editor: {
      toolbar: "Formatting",
      heading: "Heading",
      bold: "Bold",
      italic: "Italic",
      bulleted: "Bulleted list",
      numbered: "Numbered list",
      link: "Link",
      write: "Write",
      preview: "Preview",
      nothing: "Nothing to preview yet.",
    },
  },
} as const;
