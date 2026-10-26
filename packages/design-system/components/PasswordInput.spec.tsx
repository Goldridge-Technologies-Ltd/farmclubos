import { renderToStaticMarkup } from "react-dom/server";
import { PasswordInput } from "./PasswordInput";

/*
  What the server renders, which is what someone sees before the page
  hydrates: a masked field, and a toggle that names what it will do and the
  field it does it to. The toggling itself is checked in the browser.
*/
describe("PasswordInput", () => {
  const render = () =>
    renderToStaticMarkup(
      <PasswordInput
        aria-describedby="password-hint"
        autoComplete="new-password"
        hideLabel="Hide password"
        id="password"
        name="password"
        required
        showLabel="Show password"
      />,
    );

  it("starts masked, keeping the attributes it is given", () => {
    const html = render();

    expect(html).toContain('type="password"');
    expect(html).toContain('name="password"');
    expect(html).toMatch(/autocomplete="new-password"/i);
    expect(html).toContain('aria-describedby="password-hint"');
    expect(html).toMatch(/<input[^>]*required/);
  });

  it("keeps a revealed password out of spellcheck services", () => {
    const html = render();

    expect(html).toMatch(/spellcheck="false"/i);
    expect(html).toMatch(/autocapitalize="none"/i);
  });

  it("offers to show the password, naming the field it controls", () => {
    const html = render();

    expect(html).toContain('aria-label="Show password"');
    expect(html).toContain('aria-controls="password"');
    expect(html).toMatch(/<button[^>]*type="button"/);
    expect(html).not.toContain("Hide password");
  });
});
