import "./globals.css";
import "./site.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Wings Group",
  description: "Home care, cleaning, AC servicing, security, and facility management services in Northeast India."
};

export default function RootLayout({ children }: { children?: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&family=Sora:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
