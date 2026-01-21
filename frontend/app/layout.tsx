import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "./providers";

export const metadata: Metadata = {
  title: "Personalized Prophylaxis Optimization Platform",
  description: "Decision support for hemophilia prophylaxis optimization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}