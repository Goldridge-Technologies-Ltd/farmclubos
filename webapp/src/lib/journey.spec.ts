import type { Journey } from "./api/contracts";
import { finishingAfterClose, nextLesson } from "./journey";

const journey = (modules: Journey["modules"]): Journey => ({
  enrolmentId: "enrolment-1",
  status: "ACTIVE",
  progressPercent: 0,
  cohort: { id: "cohort-1", name: "September intake", status: "OPEN", selfPaced: false },
  pathway: { id: "pathway-1", slug: "foundation", title: "Foundation" },
  modules,
});

const lesson = (slug: string, status: "NOT_STARTED" | "COMPLETED") => ({
  lessonId: `lesson-${slug}`,
  slug,
  title: slug,
  status,
  completedAt: null,
});

const pathwayModule = (slug: string, sequence: number, lessons: ReturnType<typeof lesson>[]) => ({
  moduleId: `module-${slug}`,
  slug,
  title: slug,
  sequence,
  status: "NOT_STARTED" as const,
  lessonsCompleted: 0,
  lessonCount: lessons.length,
  lessons,
});

/*
  "Continue" must land on the first thing not yet done, in the order the
  pathway is meant to be taken — not the first thing in whatever order the
  data arrived, and not a lesson already finished.
*/
describe("nextLesson", () => {
  it("is the first unfinished lesson, in pathway order", () => {
    const next = nextLesson(
      journey([
        pathwayModule("second", 2, [lesson("b1", "NOT_STARTED")]),
        pathwayModule("first", 1, [lesson("a1", "COMPLETED"), lesson("a2", "NOT_STARTED")]),
      ]),
    );

    expect(next).toEqual({
      href: "/academy/foundation/modules/first/lessons/a2",
      title: "a2",
      moduleTitle: "first",
    });
  });

  it("moves on to the next module once one is finished", () => {
    const next = nextLesson(
      journey([
        pathwayModule("first", 1, [lesson("a1", "COMPLETED")]),
        pathwayModule("second", 2, [lesson("b1", "NOT_STARTED")]),
      ]),
    );

    expect(next?.href).toBe("/academy/foundation/modules/second/lessons/b1");
  });

  it("is null once every lesson is done", () => {
    expect(nextLesson(journey([pathwayModule("first", 1, [lesson("a1", "COMPLETED")])]))).toBeNull();
  });

  it("is null for a pathway with nothing published", () => {
    expect(nextLesson(journey([]))).toBeNull();
  });
});

/*
  Telling someone who has finished that they "can still finish" is wrong, and
  saying nothing to someone mid-pathway leaves them wondering if it has ended.
*/
describe("finishingAfterClose", () => {
  const closed = (status: Journey["status"]): Journey => ({
    ...journey([]),
    status,
    cohort: { id: "cohort-1", name: "September intake", status: "COMPLETED", selfPaced: false },
  });

  it("is true for someone still working through an intake that has closed", () => {
    expect(finishingAfterClose(closed("ACTIVE"))).toBe(true);
  });

  it("is false for someone who has finished it", () => {
    expect(finishingAfterClose(closed("COMPLETED"))).toBe(false);
  });

  it("is false while the intake is open", () => {
    expect(finishingAfterClose(journey([]))).toBe(false);
  });
});
