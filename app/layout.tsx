import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import VerificationBanner from "@/components/ui/VerificationBanner";

export const metadata: Metadata = {
  title: "Mesa — Restaurant Reservations",
  description: "Discover and book tables at the best restaurants near you",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <VerificationBanner />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
