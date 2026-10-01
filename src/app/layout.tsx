import type { Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "AI Explain",
  description: "Ask any question, get a beautiful visual explanation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${geist.variable} ${newsreader.variable}`} style={{ colorScheme: "dark" }}>
      <body
        className={`font-sans bg-ink text-fg antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
