import "./globals.css";

import type { Metadata } from "next";
import { UserSwitcher } from "@/components/UserSwitcher";

export const metadata: Metadata = {
  title: "CryptoYield Test Task",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 min-h-screen">
        <header className="border-b bg-white">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-semibold">
              CryptoYield <span className="text-neutral-400">(test)</span>
            </a>
            <UserSwitcher />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
