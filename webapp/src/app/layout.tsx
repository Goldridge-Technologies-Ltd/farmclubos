import type { Metadata } from "next";
import { fontVariables } from "@farmclub/design-system/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FARMCLUB OS",
    template: "%s | FARMCLUB OS",
  },
  description:
    "The FARMCLUB OS platform for agricultural entrepreneurs, innovators and institutions.",
  // Kept out of search results until the app launches.
  robots: { index: false, follow: false },
  icons: {
    icon: "/brand/favicon.svg",
    shortcut: "/brand/favicon.svg",
    apple: "/brand/app-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-farm-green-900 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {/*
          Each route group provides its own `main#main-content`: the app shell
          has a sidebar and a bar the skip link must jump past, and the auth
          screens are a centred card with neither. One `main` here would have
          to wrap the shell's chrome as well as its content.
        */}
        {children}
      </body>
    </html>
  );
}
