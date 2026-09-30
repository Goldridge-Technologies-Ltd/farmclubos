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
  openPathway: "Open pathway",

  /** Announced while each level loads; the Skeletons themselves are silent. */
  loading: {
    catalogue: "Loading the Academy",
    pathway: "Loading the pathway",
    module: "Loading the module",
    lesson: "Loading the lesson",
    assessment: "Loading the assessment",
  },

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
    /** Labels the previous/next navigation at the foot of a lesson. */
    navigation: "Lessons in this module",
    previous: "Previous lesson",
    next: "Next lesson",
    backToModule: "Back to the module",
    markComplete: "Mark as complete",
    completing: "Saving…",
    completed: "You have completed this lesson.",
    notEnrolled:
      "You are not enrolled on this pathway, so nothing is recorded against your " +
      "account. Your institution enrols you onto a cohort.",
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

  /** A lesson's scenes: its videos and notes, one screen at a time. */
  scene: {
    transcript: "Transcript",
    /** The captions track's name in the player's menu. */
    captions: "English",
  },

  assessment: {
    passMark: (percent: number) => `Pass mark ${percent}%`,
    beingAuthored: "Being written",
    start: "Start the assessment",
    resume: "Resume your attempt",
    review: "See your result",
    starting: "Opening…",
    submitting: "Submitting…",
    submit: "Submit for marking",
    savesAsYouGo: "Your answers save as you go.",
    savedAt: (time: string) => `Saved at ${time}.`,
    questionNumber: (index: number) => `Question ${index}`,
    chooseOne: "Choose one answer.",
    chooseAll: "Choose every answer that applies.",
    writeAnswer: "Write your answer in your own words.",
    writtenReviewed:
      "A written answer is marked by a person, so it is left out of the score below " +
      "rather than counted as wrong.",
    noAttemptsLeft: "You have used every attempt at this assessment.",
    attemptsUsed: (used: number, max: number | null) =>
      max === null
        ? `${used} ${used === 1 ? "attempt" : "attempts"} so far`
        : `${used} of ${max} ${max === 1 ? "attempt" : "attempts"} used`,
    result: {
      heading: "Your result",
      score: (percent: number) => `${percent}%`,
      passed: "Passed",
      notPassed: "Not passed yet",
      againstPassMark: (percent: number) => `The pass mark is ${percent}%.`,
      awaitingReview: (count: number) =>
        `${count} written ${count === 1 ? "answer is" : "answers are"} waiting to be marked by a person, and ${count === 1 ? "is" : "are"} not counted in this score.`,
      correct: "Correct",
      incorrect: "Not correct",
      awaiting: "Awaiting marking",
      retake: "Take it again",
    },
  },
} as const;
