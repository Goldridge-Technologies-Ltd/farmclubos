import { sceneToShow } from "./scenes";

const scenes = [{ id: "a" }, { id: "b" }, { id: "c" }];

/*
  Resuming at the wrong scene either repeats what a learner has done or skips
  what they have not — and nothing on the screen would say so.
*/
describe("sceneToShow", () => {
  it("shows the scene asked for, counting from one", () => {
    expect(sceneToShow("2", scenes, new Set(), true)).toBe(1);
  });

  it("resumes an enrolled learner at the first scene they have not finished", () => {
    expect(sceneToShow(undefined, scenes, new Set(["a", "b"]), true)).toBe(2);
    expect(sceneToShow(undefined, scenes, new Set(["a", "c"]), true)).toBe(1);
  });

  it("starts from the beginning once every scene is finished, to go back over it", () => {
    expect(sceneToShow(undefined, scenes, new Set(["a", "b", "c"]), true)).toBe(0);
  });

  it("starts someone not enrolled at the beginning, since nothing is recorded for them", () => {
    expect(sceneToShow(undefined, scenes, new Set(["b"]), false)).toBe(0);
  });

  it("ignores a scene number that is not one of the lesson's", () => {
    for (const requested of ["0", "4", "-1", "2.5", "two", ""]) {
      expect(sceneToShow(requested, scenes, new Set(["a"]), true)).toBe(1);
    }
  });
});
