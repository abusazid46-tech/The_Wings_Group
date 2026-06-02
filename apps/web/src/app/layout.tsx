import "./globals.css";
import "./site.css";
import type { Metadata } from "next";
import { businessName, siteUrl } from "@/components/seo-data";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${businessName} | Home Services in Agartala`,
    template: `%s | ${businessName}`
  },
  description: "Book cleaning, bathroom cleaning, AC repair, sofa cleaning, tank wash, pest control, maid, plumber, and security services in Agartala.",
  applicationName: businessName,
  keywords: [
    "home services Agartala",
    "cleaning services Agartala",
    "bathroom cleaning Agartala",
    "AC repair Agartala",
    "tank cleaning Agartala",
    "sofa cleaning Agartala",
    "pest control Agartala",
    "maid service Agartala",
    "security guard Agartala",
    "The Wings Group"
  ],
  authors: [{ name: businessName }],
  creator: businessName,
  publisher: businessName,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: businessName,
    title: `${businessName} | Home Services in Agartala`,
    description: "Book professional home cleaning, AC service, tank wash, pest control, maid, plumber, and security services in Agartala.",
    images: [
      {
        url: "/the-wings-logo.png",
        width: 357,
        height: 227,
        alt: `${businessName} logo`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${businessName} | Home Services in Agartala`,
    description: "Book professional cleaning, AC repair, tank wash, sofa cleaning, pest control, maid, plumber, and security services in Agartala.",
    images: ["/the-wings-logo.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  category: "Home Services",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/the-wings-logo.png"
  },
  manifest: "/site.webmanifest",
  other: {
    "geo.region": "IN-TR",
    "geo.placename": "Agartala",
    "geo.position": "23.8315;91.2868",
    ICBM: "23.8315, 91.2868"
  }
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
