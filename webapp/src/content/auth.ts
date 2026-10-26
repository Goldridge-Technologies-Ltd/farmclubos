/*
  Copy for the screens reached before anyone is signed in.

  Copy is never hardcoded in JSX (docs/design-system.md §13). The website keeps
  its copy in site/content/pages/*.ts; this is the same idea for the app.
*/

export type AuthScreen = {
  heading: string;
  description: string;
  submitLabel: string;
  busyLabel: string;
};

export type AuthContent = {
  /** Shown under the form on every screen in this group. */
  requiredNote: string;
  signIn: AuthScreen & {
    forgotPassword: string;
    afterReset: string;
    newHere: string;
    createAccount: string;
    invited: string;
  };
  forgotPassword: AuthScreen & { backToSignIn: string };
  signUp: AuthScreen & {
    sent: string;
    haveAccount: string;
    signIn: string;
  };
  /** Under the forms that create an account for someone signing themselves up. */
  terms: {
    lead: string;
    termsOfService: { label: string; href: string };
    and: string;
    privacyPolicy: { label: string; href: string };
    /** Read after each link; not shown. */
    newTab: string;
  };
  resetPassword: AuthScreen & { expired: string };
  acceptInvite: {
    loading: string;
    loadError: { heading: string; description: string; retry: string };
    heading: (institution: string) => string;
    description: (institution: string, role: string) => string;
    /** An invitation onto the content team, which belongs to no institution. */
    contentTeam: { heading: string; description: string; joinDescription: string };
    /** A link someone sent themselves by signing up: no institution is named. */
    signUp: { heading: string; description: string; alreadyHaveAccount: string };
    submitLabel: string;
    busyLabel: string;
    alreadyHaveAccount: {
      heading: string;
      description: (institution: string) => string;
      signInLabel: string;
      joinLabel: string;
      busyLabel: string;
    };
    unusable: {
      heading: string;
      description: string;
      action: string;
    };
  };
  labels: {
    email: string;
    password: string;
    newPassword: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
  };
  hints: {
    newPassword: string;
  };
  /** What each password field's show/hide button says to a screen reader. */
  passwordToggles: Record<"password" | "newPassword" | "confirmPassword", PasswordToggle>;
};

type PasswordToggle = { showLabel: string; hideLabel: string };

/** How each role reads to the person being invited. */
export const roleLabels: Record<string, string> = {
  INSTITUTION_ADMIN: "an administrator",
  FACILITATOR: "a facilitator",
  MENTOR: "a mentor",
  LEARNER: "a learner",
};

export const authContent: AuthContent = {
  requiredNote: "Fields marked * are required.",

  signIn: {
    heading: "Sign in",
    description: "Use the email you signed up or were invited with.",
    submitLabel: "Sign in",
    busyLabel: "Signing in…",
    forgotPassword: "Forgotten your password?",
    // Also shown to a new platform administrator, whose emailed link set a first password.
    afterReset: "Your password is saved. Sign in with it.",
    newHere: "New to FARMCLUB OS?",
    createAccount: "Create an account",
    invited: "Invited by an institution? Use the link in your invitation email instead.",
  },

  signUp: {
    heading: "Create your account",
    description:
      "Enter your email and we will send you a link to finish setting up your account. " +
      "You can then start any pathway in the Academy and learn at your own pace.",
    submitLabel: "Send the link",
    busyLabel: "Sending…",
    // The same whether or not the address has an account; the email says which.
    sent: "Check your email for a link to finish creating your account.",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
  },

  terms: {
    lead: "By creating an account, you agree to the",
    termsOfService: {
      label: "Terms of Service",
      href: "https://farmclub-os.com/terms-of-service",
    },
    and: "and",
    privacyPolicy: { label: "Privacy Policy", href: "https://farmclub-os.com/privacy-policy" },
    newTab: "(opens in a new tab)",
  },

  forgotPassword: {
    heading: "Reset your password",
    description:
      "Enter the email on your account and we will send a link to choose a new password.",
    submitLabel: "Send the link",
    busyLabel: "Sending…",
    backToSignIn: "Back to sign in",
  },

  resetPassword: {
    heading: "Choose a new password",
    description: "This signs you out everywhere else.",
    submitLabel: "Save the new password",
    busyLabel: "Saving…",
    expired:
      "This reset link is invalid or has expired. Request a new one and use the newest email.",
  },

  acceptInvite: {

    loading: "Loading your invitation",

    loadError: {

      heading: "We could not load your invitation",

      description: "Something went wrong reaching FARMCLUB OS. Your invitation is unaffected.",

      retry: "Try again",

    },
    heading: (institution) => `Join ${institution}`,
    description: (institution, role) =>
      `You have been invited to join ${institution} on FARMCLUB OS as ${role}. Choose a password to finish setting up your account.`,
    contentTeam: {
      heading: "Join the content team",
      description:
        "You have been invited to join the FARMCLUB OS content team, which builds the Academy for every institution. Choose a password to finish setting up your account.",
      joinDescription:
        "Sign in with this email, and you can join the content team that builds the Academy.",
    },
    signUp: {
      heading: "Finish creating your account",
      description:
        "Add your name and choose a password. You can then start any pathway in the Academy " +
        "and learn at your own pace.",
      alreadyHaveAccount:
        "This email already has an account. Sign in, then start any pathway from the Academy.",
    },
    submitLabel: "Create my account",
    busyLabel: "Creating…",
    alreadyHaveAccount: {
      heading: "You already have an account",
      description: (institution) =>
        `Sign in with this email, and you can add ${institution} to your account.`,
      signInLabel: "Sign in to continue",
      joinLabel: "Join",
      busyLabel: "Joining…",
    },
    unusable: {
      heading: "This invitation cannot be used",
      description:
        "It may have expired, been withdrawn, or already been accepted. Ask whoever invited you to send a new one.",
      action: "Go to sign in",
    },
  },

  labels: {
    email: "Email address",
    password: "Password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    firstName: "First name",
    lastName: "Last name",
  },

  hints: {
    newPassword: "At least 10 characters. Length matters more than symbols.",
  },

  passwordToggles: {
    password: { showLabel: "Show password", hideLabel: "Hide password" },
    newPassword: { showLabel: "Show new password", hideLabel: "Hide new password" },
    confirmPassword: {
      showLabel: "Show the confirmed password",
      hideLabel: "Hide the confirmed password",
    },
  },
};
