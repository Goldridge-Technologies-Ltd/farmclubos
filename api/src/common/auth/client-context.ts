/**
 * Request details recorded on a session. Informational only, never used for a
 * security decision: behind the web app these describe the forwarded client,
 * which a caller can set.
 */
export type ClientContext = {
  userAgent?: string;
  ipAddress?: string;
  /**
   * The client address *as forwarded*, present only when the request actually
   * carried `x-forwarded-for`.
   *
   * Kept separate from `ipAddress`, which falls back to the direct peer. Behind
   * the web app that peer is the web app itself, so throttling on it would
   * count every user against one budget and lock everybody out together. Only
   * a genuinely forwarded address is worth keying on — and even then it is
   * spoofable, so it only ever supplements the account key.
   */
  forwardedFor?: string;
};
