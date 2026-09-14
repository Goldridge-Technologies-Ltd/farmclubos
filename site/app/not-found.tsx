import Link from "next/link";

export default function NotFound() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="site-container max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-farm-gold-500">
          404
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-farm-green-950">
          Page not found
        </h1>
        <p className="mt-5 text-lg leading-8 text-farm-muted">
          The page you are looking for is not available.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex text-sm font-semibold text-farm-green-800 underline decoration-farm-gold-500 decoration-2 underline-offset-4"
        >
          Return home
        </Link>
      </div>
    </section>
  );
}
