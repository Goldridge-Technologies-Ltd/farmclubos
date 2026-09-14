import { Inter, Poppins } from "next/font/google";

/*
  The brand stack is Aptos / Avenir Next / Montserrat / Inter. Aptos is not
  available as a webfont, so every FARMCLUB OS app self-hosts the two faces
  that match the reference artwork: a geometric display face for headings and
  a grotesque for interface and body copy. styles/theme.css reads the two
  variables.
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

/** Put on <html> in each app's root layout. */
export const fontVariables = `${display.variable} ${sans.variable}`;
