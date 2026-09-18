/** Every template renders to both parts, so no client is left with nothing. */
export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};
