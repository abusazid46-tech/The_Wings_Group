import Link from "next/link";
import type { Metadata } from "next";
import {
  businessAddress,
  businessName,
  businessPhone,
  findSeoService,
  seoServices,
  serviceAreas,
  siteUrl
} from "@/components/seo-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return seoServices.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = findSeoService(slug);
  if (!service) {
    return {
      title: "Home Services in Agartala",
      description: "Book The Wings Group for trusted home services in Agartala."
    };
  }

  return {
    title: service.title,
    description: service.description,
    keywords: [...service.keywords],
    alternates: {
      canonical: `/services/${service.slug}/`
    },
    openGraph: {
      title: `${service.title} | ${businessName}`,
      description: service.description,
      url: `${siteUrl}/services/${service.slug}/`,
      images: ["/the-wings-logo.png"]
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.title} | ${businessName}`,
      description: service.description,
      images: ["/the-wings-logo.png"]
    }
  };
}

export default async function ServiceSeoPage({ params }: PageProps) {
  const { slug } = await params;
  const service = findSeoService(slug) ?? seoServices[0];
  const relatedServices = seoServices.filter((item) => item.slug !== service.slug).slice(0, 6);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    url: `${siteUrl}/services/${service.slug}/`,
    provider: {
      "@type": "LocalBusiness",
      name: businessName,
      telephone: businessPhone,
      url: siteUrl,
      address: {
        "@type": "PostalAddress",
        ...businessAddress
      }
    },
    areaServed: serviceAreas.map((area) => ({
      "@type": "Place",
      name: area
    })),
    serviceType: service.name
  };

  return (
    <main className="seo-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema).replace(/</g, "\\u003c")
        }}
      />
      <section className="seo-hero">
        <div className="container">
          <Link className="seo-logo-link" href="/">
            <img src="/the-wings-logo.png" alt={`${businessName} logo`} />
            <span>{businessName}</span>
          </Link>
          <div className="section-label">Agartala Home Services</div>
          <h1>{service.title}</h1>
          <p>{service.description}</p>
          <div className="seo-actions">
            <Link className="btn-cta-primary" href="/#services">Book this service</Link>
            <a className="btn-cta-outline" href="tel:+919774887803">Call 9774887803</a>
          </div>
        </div>
      </section>

      <section className="seo-content-section">
        <div className="container">
          <div className="seo-content-grid">
            <article>
              <h2>{service.name} by The Wings Group</h2>
              <p>
                The Wings Group provides {service.name.toLowerCase()} for customers in Agartala with trained professionals,
                clear booking flow, local support, and flexible payment options.
              </p>
              <p>
                Service availability is focused on Agartala and nearby areas including {serviceAreas.slice(1, 6).join(", ")}.
                For the fastest confirmation, book online or call the team directly.
              </p>
              <h3>Why choose us in Agartala?</h3>
              <ul>
                <li>Local Agartala service team and customer support.</li>
                <li>Verified professionals for cleaning, repair, care, and security work.</li>
                <li>Cash on delivery and online payment options where available.</li>
                <li>Simple website booking with booking history and status updates.</li>
              </ul>
            </article>
            <aside className="seo-contact-card">
              <h2>Book in Agartala</h2>
              <p>{businessAddress.streetAddress}, {businessAddress.addressLocality}, {businessAddress.addressRegion}</p>
              <a href="tel:+919774887803">Call 9774887803</a>
              <a href="https://wa.me/919774887803">WhatsApp The Wings Group</a>
            </aside>
          </div>
        </div>
      </section>

      <section className="seo-related-section">
        <div className="container">
          <h2>More services in Agartala</h2>
          <div className="seo-related-grid">
            {relatedServices.map((item) => (
              <Link href={`/services/${item.slug}/`} key={item.slug}>
                <strong>{item.name}</strong>
                <span>{item.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
