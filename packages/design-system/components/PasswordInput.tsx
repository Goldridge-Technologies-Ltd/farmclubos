"use client";

import { useEffect, useRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { fieldClass } from "./form-classes";
import { Icon } from "./Icon";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  /** Put on the input; the toggle names it in aria-controls. Field hands it over. */
  id: string;
  /** The toggle's accessible name while the password is hidden, e.g. "Show password". */
  showLabel: string;
  /** Its name while the password is shown, e.g. "Hide password". */
  hideLabel: string;
};

/**
 * A password input with a button that shows and hides what has been typed,
 * for every password field (docs/design-system.md §10). Use it inside
 * `Field`, passing on `id`, `describedBy` and `invalid` as for any control.
 *
 * - The toggle is a real `type="button"`, so it never submits the form, and
 *   its accessible name says what pressing it will do.
 * - Spellcheck and autocapitalisation stay off: a shown password is plain
 *   text, and some browsers send plain text to a spellcheck service.
 * - Submitting the form masks it again, so a password manager sees a
 *   password field and the next screen never opens with one on show.
 */
export function PasswordInput({ id, showLabel, hideLabel, disabled, ...rest }: PasswordInputProps) {
  const [shown, setShown] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = input.current?.form;

    if (!form) {
      return;
    }

    const mask = () => setShown(false);
    form.addEventListener("submit", mask);

    return () => form.removeEventListener("submit", mask);
  }, []);

  return (
    <div className="relative">
      <input
        {...rest}
        autoCapitalize="none"
        autoCorrect="off"
        className={`${fieldClass} pr-12`}
        disabled={disabled}
        id={id}
        ref={input}
        spellCheck={false}
        type={shown ? "text" : "password"}
      />
      <button
        aria-controls={id}
        aria-label={shown ? hideLabel : showLabel}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-button text-farm-muted transition-colors hover:text-farm-green-800 disabled:cursor-not-allowed disabled:hover:text-farm-muted"
        disabled={disabled}
        onClick={() => setShown((current) => !current)}
        type="button"
      >
        <Icon name={shown ? "eye-off" : "eye"} size={20} />
      </button>
    </div>
  );
}
