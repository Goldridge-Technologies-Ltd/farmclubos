/** Emails are stored and compared trimmed and lower-cased. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
