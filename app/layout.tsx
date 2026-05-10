import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mesa — Restaurant Reservations",
  description: "Discover and book tables at the best restaurants near you",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
