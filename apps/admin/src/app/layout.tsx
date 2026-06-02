import "./styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Wings Group Admin",
  description: "Admin CRM and booking operations dashboard for The Wings Group.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/the-wings-logo.png"
  }
};

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
