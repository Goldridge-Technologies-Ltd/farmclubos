import { parseNotes } from "./notes";

/*
  Lesson notes are typed by the content team and read by every learner. The
  syntax is small on purpose — headings, bold, italic, lists and links — and
  nothing in it can become HTML, so a stray angle bracket is only ever text.
*/
describe("parseNotes", () => {
  it("makes paragraphs from blank-line-separated text, joining wrapped lines", () => {
    expect(parseNotes("A crop is not\nan enterprise.\n\nIt needs a buyer.")).toEqual([
      { type: "paragraph", children: [{ type: "text", text: "A crop is not an enterprise." }] },
      { type: "paragraph", children: [{ type: "text", text: "It needs a buyer." }] },
    ]);
  });

  it("reads ## as a heading, and ### as a smaller one", () => {
    expect(parseNotes("## The enterprise lens\n### Customer")).toEqual([
      { type: "heading", level: 3, children: [{ type: "text", text: "The enterprise lens" }] },
      { type: "heading", level: 4, children: [{ type: "text", text: "Customer" }] },
    ]);
  });

  it("treats a single # as a heading too, since the lesson already has its title", () => {
    expect(parseNotes("# Four flows")[0]).toMatchObject({ type: "heading", level: 3 });
  });

  it("gathers bulleted and numbered lines into lists", () => {
    expect(parseNotes("- Product\n* Money\n\n1. Plan\n2) Grow")).toEqual([
      {
        type: "list",
        ordered: false,
        items: [[{ type: "text", text: "Product" }], [{ type: "text", text: "Money" }]],
      },
      {
        type: "list",
        ordered: true,
        items: [[{ type: "text", text: "Plan" }], [{ type: "text", text: "Grow" }]],
      },
    ]);
  });

  it("reads bold, italic and both", () => {
    expect(parseNotes("**Value** comes _first_, **_always_**.")[0]).toEqual({
      type: "paragraph",
      children: [
        { type: "strong", children: [{ type: "text", text: "Value" }] },
        { type: "text", text: " comes " },
        { type: "em", children: [{ type: "text", text: "first" }] },
        { type: "text", text: ", " },
        { type: "strong", children: [{ type: "em", children: [{ type: "text", text: "always" }] }] },
        { type: "text", text: "." },
      ],
    });
  });

  it("leaves underscores inside words alone", () => {
    expect(parseNotes("Use crop_plan_v2 as it is.")[0]).toEqual({
      type: "paragraph",
      children: [{ type: "text", text: "Use crop_plan_v2 as it is." }],
    });
  });

  it("keeps an unclosed marker as the character it is", () => {
    expect(parseNotes("5 * 3 and **half")[0]).toEqual({
      type: "paragraph",
      children: [{ type: "text", text: "5 * 3 and **half" }],
    });
  });

  it("makes a link only of a web or email address", () => {
    expect(parseNotes("[Guide](https://example.org/guide) and [trap](javascript:alert(1))")[0]).toEqual({
      type: "paragraph",
      children: [
        {
          type: "link",
          href: "https://example.org/guide",
          children: [{ type: "text", text: "Guide" }],
        },
        { type: "text", text: " and [trap](javascript:alert(1))" },
      ],
    });
  });

  it("never turns markup into anything but text", () => {
    expect(parseNotes('<script>alert("x")</script>')).toEqual([
      { type: "paragraph", children: [{ type: "text", text: '<script>alert("x")</script>' }] },
    ]);
  });

  it("lets a backslash keep a marker as itself", () => {
    expect(parseNotes("\\*not italic\\*")[0]).toEqual({
      type: "paragraph",
      children: [{ type: "text", text: "*not italic*" }],
    });
  });

  it("gives nothing for nothing", () => {
    expect(parseNotes("  \n\n  ")).toEqual([]);
  });
});
