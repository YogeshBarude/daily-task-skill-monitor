import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Task & Skill Monitor",
  description: "Weekly work, learning, time, and productivity tracker"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
