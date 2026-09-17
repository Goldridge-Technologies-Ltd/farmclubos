import { Transform } from "class-transformer";

/** Trims a string field before validation, so "  " fails a length check. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value));
