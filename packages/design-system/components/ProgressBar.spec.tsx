import { renderToStaticMarkup } from "react-dom/server";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  const render = (value: number, hideValue = false) =>
    renderToStaticMarkup(
      <ProgressBar hideValue={hideValue} label="Greenhouse Enterprise" value={value} />,
    );

  it("reports the value to assistive technology and in words", () => {
    const html = render(42);

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="42"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-label="Greenhouse Enterprise"');
    // A text equivalent, not width alone (docs/design-system.md §12).
    expect(html).toContain("42%");
    expect(html).toContain("width:42%");
  });

  it.each([
    [-20, 0],
    [0, 0],
    [100, 100],
    [140, 100],
  ])("clamps %p to %p, so the fill can never leave the track", (value, expected) => {
    const html = render(value);

    expect(html).toContain(`aria-valuenow="${expected}"`);
    expect(html).toContain(`width:${expected}%`);
  });

  it("rounds a fraction, since a progress figure is shown whole", () => {
    expect(render(66.6)).toContain('aria-valuenow="67"');
  });

  it("treats a value that is not a number as no progress", () => {
    expect(render(Number.NaN)).toContain('aria-valuenow="0"');
  });

  it("keeps the value available to screen readers when the text is hidden", () => {
    const html = render(42, true);

    expect(html).not.toContain(">42%<");
    expect(html).toContain('aria-valuenow="42"');
  });
});
