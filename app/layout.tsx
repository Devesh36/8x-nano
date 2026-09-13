import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naano — Creator marketplace",
  description: "A polished local rebuild of the Naano creator workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
