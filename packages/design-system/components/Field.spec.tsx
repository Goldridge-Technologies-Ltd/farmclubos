import { renderToStaticMarkup } from "react-dom/server";
import { Field } from "./Field";

/*
  The wiring is the point: a field whose error is not announced looks correct
  on screen, so only a test catches it.
*/
describe("Field", () => {
  const render = (markup: React.ReactElement) => renderToStaticMarkup(markup);

  it("ties the label to the control it renders", () => {
    const html = render(
      <Field label="Email address" name="email">
        {({ id }) => <input id={id} name="email" />}
      </Field>,
    );

    expect(html).toContain('for="email"');
    expect(html).toContain('id="email"');
  });

  it("leaves a valid field undescribed and not marked invalid", () => {
    const html = render(
      <Field label="Email address" name="email">
        {({ describedBy, invalid }) => (
          <input aria-describedby={describedBy} aria-invalid={invalid} name="email" />
        )}
      </Field>,
    );

    expect(html).not.toContain("aria-describedby");
    expect(html).toContain('aria-invalid="false"');
    expect(html).not.toContain('role="alert"');
  });

  it("announces an error once, from outside the label", () => {
    const html = render(
      <Field label="Email address" name="email" error="Enter a valid email address.">
        {({ describedBy, invalid }) => (
          <input aria-describedby={describedBy} aria-invalid={invalid} name="email" />
        )}
      </Field>,
    );

    expect(html).toContain('aria-describedby="email-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('id="email-error"');
    expect(html).toContain('role="alert"');
    // Outside the label: a label wrapping it would have it read twice.
    expect(html.indexOf("</label>")).toBeLessThan(html.indexOf('id="email-error"'));
  });

  it("describes the control by its hint, and by both when it also errs", () => {
    const withHint = render(
      <Field label="Password" name="password" hint="At least 10 characters.">
        {({ describedBy }) => <input aria-describedby={describedBy} name="password" />}
      </Field>,
    );

    expect(withHint).toContain('aria-describedby="password-hint"');

    const withBoth = render(
      <Field label="Password" name="password" hint="At least 10 characters." error="Too short.">
        {({ describedBy }) => <input aria-describedby={describedBy} name="password" />}
      </Field>,
    );

    expect(withBoth).toContain('aria-describedby="password-hint password-error"');
  });

  it("marks a required field for sight and hides the marker from screen readers", () => {
    const html = render(
      <Field label="Full name" name="name" required>
        {({ id }) => <input id={id} name="name" />}
      </Field>,
    );

    // The asterisk is decoration; the `required` attribute carries the meaning.
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("*");
  });
});
