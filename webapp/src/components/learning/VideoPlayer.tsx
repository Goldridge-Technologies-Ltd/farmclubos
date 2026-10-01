import { academy } from "@/content/academy";

/*
  A scene's video, as the browser's own player: keyboard operable, and with
  captions the viewer can turn off from it. Nothing downloads until play is
  pressed — the still image stands in until then, which is the low-bandwidth
  fallback the production script asks for.

  Captions are on by default when a scene has them, since much of the
  audience will watch without sound. They are optional for the content team,
  so a video may come without them, and then without a transcript too, which
  is made from the same file and sits beneath for anyone who would rather read.

  The links are signed and expire, so they are never cached beyond the page.
  `crossOrigin` because a caption track comes from storage, another origin,
  and the browser only loads one from there under CORS.
*/
export function VideoPlayer({
  video,
  transcript,
}: {
  /**
   * A learner's video always has a still image, and captions only when the
   * content team added them; the content team's preview may lack either.
   */
  video: { url: string; contentType: string; captionsUrl: string | null; posterUrl: string | null };
  transcript: string | null;
}) {
  const copy = academy.scene;

  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-card bg-farm-green-950">
        <video
          className="aspect-video w-full"
          controls
          crossOrigin="anonymous"
          playsInline
          poster={video.posterUrl ?? undefined}
          preload="none"
        >
          <source src={video.url} type={video.contentType} />
          {video.captionsUrl ? (
            <track default kind="captions" label={copy.captions} src={video.captionsUrl} srcLang="en" />
          ) : null}
        </video>
      </div>

      {transcript ? (
        <details className="group rounded-card border border-farm-border bg-white px-5 py-4">
          <summary className="cursor-pointer text-sm font-semibold text-farm-green-800">
            {copy.transcript}
          </summary>
          <div className="mt-3 grid gap-3">
            {transcript.split("\n\n").map((paragraph, index) => (
              <p key={index} className="type-body-sm text-farm-charcoal">
                {paragraph}
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
