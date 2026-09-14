import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

/*
  The brand stack is Aptos / Avenir Next / Montserrat / Inter. Aptos is not
  available as a webfont, so the site self-hosts the two faces that match the
  reference artwork: a geometric display face for headings and a grotesque for
  interface and body copy.
*/
const display = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-farm-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-farm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://farmclub-os.com"),
  title: {
    default: "FARMCLUB OS",
    template: "%s | FARMCLUB OS",
  },
  description:
    "FARMCLUB OS is a digital platform for agricultural entrepreneurship, innovation and ecosystem transformation.",
  icons: {
    icon: "/brand/favicon.svg",
    shortcut: "/brand/favicon.svg",
    apple: "/brand/app-icon.svg",
  },
  openGraph: {
    title: "FARMCLUB OS",
    description:
      "A digital platform for agricultural entrepreneurship, innovation and ecosystem transformation.",
    siteName: "FARMCLUB OS",
    images: [
      {
        url: "/brand/social-avatar.svg",
        width: 1080,
        height: 1080,
        alt: "FARMCLUB OS",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-farm-green-900 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
