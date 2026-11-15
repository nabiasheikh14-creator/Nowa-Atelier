import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Scope One (Dalton Maag, OFL) is self-hosted so the room never waits on a font CDN.
const display = localFont({
  src: "../public/fonts/ScopeOne-Regular.ttf",
  variable: "--font-display",
  display: "swap",
  // Scope One ships with a very deep descent (928 up, 455 down), so text sits high in any
  // box: chips, buttons, inputs. Rebalancing the line box around the x-height centres it.
  declarations: [
    { prop: "ascent-override", value: "95%" },
    { prop: "descent-override", value: "35%" },
    { prop: "line-gap-override", value: "0%" },
  ],
});

const body = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  variable: "--font-body",
});

const description = "A private collection of books, kept in a quiet room.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "The Library",
  description,
  openGraph: {
    title: "The Library",
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Library",
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
