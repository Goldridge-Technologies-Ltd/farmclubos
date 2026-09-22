/*
  Copy for the Academy screens.

  Counts and progress are never written here — they come from the API, which
  reads them from real rows. What this file holds is the wording around them,
  including the plural forms, so a screen never prints "1 modules".
*/

export const academy = {
  eyebrow: "Learn",
  heading: "Academy",
  description:
    "Structured pathways that take you from the fundamentals of agriculture to " +
    "running a production enterprise. Work through a pathway module by module.",
  crumb: "Academy",

  levels: {
    FOUNDATION: "Foundation",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
  },

  lessonKinds: {
    TEXT: "Reading",
    VIDEO: "Video",
    DOWNLOAD: "Download",
    PRACTICAL: "Practical",
  },

  assessmentKinds: {
    QUIZ: "Quiz",
    SUBMISSION: "Submission",
    PRACTICAL: "Practical assessment",
  },

  counts: {
    modules: (count: number) => `${count} ${count === 1 ? "module" : "modules"}`,
    lessons: (count: number) => `${count} ${count === 1 ? "lesson" : "lessons"}`,
    assessments: (count: number) =>
      `${count} ${count === 1 ? "assessment" : "assessments"}`,
    questions: (count: number) => `${count} ${count === 1 ? "question" : "questions"}`,
  },

  empty: {
    pathways: {
      title: "No pathways published yet",
      description:
        "The catalogue is empty. Once a pathway is published it will appear here.",
    },
    modules: {
      title: "This pathway has no published modules yet",
      description: "Its modules are being prepared, and will appear here as they land.",
    },
    lessons: {
      title: "This module has no published lessons yet",
      description: "Its lessons are being prepared, and will appear here as they land.",
    },
  },

  pathway: {
    modulesHeading: "Modules",
    modulesDescription: "Work through them in order; each builds on the one before.",
  },

  module: {
    lessonsHeading: "Lessons",
    assessmentsHeading: "Assessments",
    assessmentsDescription:
      "Complete the lessons first. An assessment records what you have understood.",
    noAssessments: "This module has no assessment.",
  },

  lesson: {
    previous: "Previous lesson",
    next: "Next lesson",
    backToModule: "Back to the module",
    /*
      The seeded lessons are outlines: a title and a summary, with no body
      written yet. Saying so plainly is the point — a blank page would read as
      something broken, and invented filler would be worse than either.
    */
    beingAuthored: {
      title: "This lesson is being written",
      description:
        "The outline is set and the content is being authored. It will appear here " +
        "when it is ready.",
    },
    inReview: {
      title: "This lesson is in review",
      description: "It has been written and is being checked before it is published.",
    },
  },

  assessment: {
    passMark: (percent: number) => `Pass mark ${percent}%`,
    beingAuthored: "Being written",
  },
} as const;
