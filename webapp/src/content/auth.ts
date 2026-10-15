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
    noAccount: string;
  };
  forgotPassword: AuthScreen & { backToSignIn: string };
  resetPassword: AuthScreen & { expired: string };
  acceptInvite: {
    loading: string;
    loadError: { heading: string; description: string; retry: string };
    heading: (institution: string) => string;
    description: (institution: string, role: string) => string;
    /** An invitation onto the content team, which belongs to no institution. */
    contentTeam: { heading: string; description: string; joinDescription: string };
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
};

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
    description: "Use the email your institution invited you with.",
    submitLabel: "Sign in",
    busyLabel: "Signing in…",
    forgotPassword: "Forgotten your password?",
    // Also shown to a new platform administrator, whose emailed link set a first password.
    afterReset: "Your password is saved. Sign in with it.",
    noAccount:
      "Accounts are created by invitation. Ask your institution's administrator to invite you.",
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
};
