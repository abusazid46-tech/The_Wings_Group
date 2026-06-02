import { AboutContent } from "@/components/AboutContent";
import { businessName, siteUrl } from "@/components/seo-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `About ${businessName} Agartala`,
  description: "Learn about The Wings Group, an Agartala home services brand for cleaning, security, facility management, AC service, tank wash, and home care.",
  alternates: {
    canonical: "/about/"
  },
  openGraph: {
    title: `About ${businessName}`,
    description: "Agartala home services company for cleaning, security, facility management, AC service, tank wash, and home care.",
    url: `${siteUrl}/about/`
  }
};

export default function AboutPage() {
  return <AboutContent />;
}
