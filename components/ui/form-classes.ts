/*
  Shared form class strings. They live in a plain module rather than in the
  client form so Server Components (such as /design-system) receive the actual
  strings instead of a client reference.
*/

/**
 * Text inputs, selects and textareas. Focus shows the global two-tone ring
 * plus a green border; aria-invalid="true" turns the border red; disabled
 * fields fade to cream.
 */
export const fieldClass =
  "min-h-12 w-full rounded-button border border-farm-border-strong bg-white px-3.5 text-sm text-farm-charcoal placeholder:text-farm-muted focus:border-farm-green-700 aria-invalid:border-farm-danger aria-invalid:focus:border-farm-green-700 disabled:cursor-not-allowed disabled:border-farm-border disabled:bg-farm-cream-100 disabled:text-farm-muted";
