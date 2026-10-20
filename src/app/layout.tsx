import type { Metadata } from "next";
import { Michroma } from "next/font/google";
import "./globals.css";

// Michroma is only used for the "Menu" label; everything else is local.
const michroma = Michroma({
  variable: "--font-michroma",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BoatEye360 — See What the Night Hides",
  description:
    "Full-color marine night vision. BoatEye360 helps you see what lies ahead when visibility fades.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${michroma.variable} antialiased`}>
      <head>
        <link
          rel="preload"
          href="/assets/fonts/Audiowide-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
