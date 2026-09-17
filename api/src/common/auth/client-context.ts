/**
 * Request details recorded on a session. Informational only, never used for a
 * security decision: behind the web app they describe the forwarded client,
 * which a caller can set.
 */
export type ClientContext = {
  userAgent?: string;
  ipAddress?: string;
};
