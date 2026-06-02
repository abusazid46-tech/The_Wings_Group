import { CustomerHome } from "@/components/CustomerHome";
import {
  businessAddress,
  businessName,
  businessPhone,
  faqItems,
  seoServices,
  serviceAreas,
  siteUrl,
  whatsappUrl
} from "@/components/seo-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cleaning, AC Repair, Tank Wash & Home Services in Agartala",
  description: "Book The Wings Group for bathroom cleaning, AC repair, tank wash, sofa cleaning, pest control, maid, plumber, and security services in Agartala.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "The Wings Group | Home Services in Agartala",
    description: "Professional cleaning, AC service, tank wash, sofa cleaning, pest control, maid, plumber, and security services in Agartala.",
    url: siteUrl
  }
};

export default function HomePage() {
  return (
    <>
      <StructuredData data={[localBusinessSchema, servicesSchema, faqSchema]} />
      <CustomerHome />
    </>
  );
}

function StructuredData({ data }: { data: unknown[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c")
      }}
    />
  );
}

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#local-business`,
  name: businessName,
  url: siteUrl,
  logo: `${siteUrl}/the-wings-logo.png`,
  image: `${siteUrl}/the-wings-logo.png`,
  telephone: businessPhone,
  priceRange: "Rs",
  description: "Home services company in Agartala for cleaning, AC repair, tank wash, sofa cleaning, pest control, maid, plumber, and security services.",
  address: {
    "@type": "PostalAddress",
    ...businessAddress
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 23.8315,
    longitude: 91.2868
  },
  areaServed: serviceAreas.map((area) => ({
    "@type": "Place",
    name: area
  })),
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: businessPhone,
      contactType: "customer service",
      areaServed: "Agartala",
      availableLanguage: ["English", "Hindi", "Bengali"]
    }
  ],
  sameAs: [whatsappUrl],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "21:00"
    }
  ]
};

const servicesSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": `${siteUrl}/#services`,
  name: "Home services in Agartala",
  itemListElement: seoServices.map((service, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Service",
      name: service.name,
      description: service.description,
      provider: {
        "@id": `${siteUrl}/#local-business`
      },
      areaServed: {
        "@type": "City",
        name: "Agartala"
      },
      url: `${siteUrl}/services/${service.slug}/`
    }
  }))
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer
    }
  }))
};
