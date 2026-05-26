import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import I18nProvider from "@/components/I18nProvider";

export const metadata: Metadata = {
  title: "Mesa — Restaurant Reservations",
  description: "Discover and book tables at the best restaurants near you",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
