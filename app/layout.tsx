import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TablePro - Restaurant Reservations",
  description: "Book tables at your favourite restaurants",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">{children}</body>
    </html>
  );
}
