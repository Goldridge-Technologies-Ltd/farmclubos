"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";

type Status = "idle" | "invalid" | "unavailable";

/*
  The newsletter service is not connected yet (see docs/project-brief.md).
  Rather than silently discarding an address, the form validates locally and
  tells the visitor plainly that subscriptions are not live, pointing them at
  an address that does reach the team.
*/
export function NewsletterSignup() {
  const [status, setStatus] = useState<Status>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(
      new FormData(event.currentTarget).get("email") ?? ""
    ).trim();
    setStatus(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "unavailable" : "invalid");
  }

  return (
    <div>
      <h3 className="type-overline text-white">
        Stay Updated
      </h3>
      <p className="mt-4 text-sm leading-6 text-white/64">
        Subscribe for updates on the platform, programmes and opportunities.
      </p>
      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <div className="flex overflow-hidden rounded-button border border-white/22 bg-white/8 focus-within:border-farm-gold-400">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            aria-describedby="newsletter-status"
            className="w-full min-w-[6.5rem] flex-1 bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-1.5 bg-farm-green-700 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-farm-green-600"
          >
            Subscribe
            <Icon name="arrow-right" size={15} />
          </button>
        </div>
        <p
          id="newsletter-status"
          role={status === "idle" ? undefined : "status"}
          className="mt-3 type-caption text-white/58"
        >
          {status === "invalid" ? (
            <span className="text-farm-gold-400">
              Enter a valid email address.
            </span>
          ) : status === "unavailable" ? (
            <span className="text-farm-gold-400">
              Subscriptions are not connected yet. Email{" "}
              <a href="mailto:hello@farmclubos.com" className="underline">
                hello@farmclubos.com
              </a>{" "}
              to be added to the list.
            </span>
          ) : (
            "Newsletter delivery is not connected yet."
          )}
        </p>
      </form>
    </div>
  );
}
