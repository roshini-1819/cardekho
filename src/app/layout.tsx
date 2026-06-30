import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarMatch — find the right car, fast",
  description:
    "Answer a few questions and get a ranked, explained shortlist of cars that fit you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
