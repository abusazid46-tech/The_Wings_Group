import type { Metadata } from "next";
import Link from "next/link";
import { businessName, businessPhone, siteUrl } from "@/components/seo-data";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and conditions for booking The Wings Group home services in Agartala.",
  alternates: {
    canonical: "/terms/"
  }
};

export default function TermsPage() {
  return (
    <main className="seo-page">
      <section className="seo-hero">
        <div className="container">
          <Link className="seo-logo-link" href="/">
            <img src="/the-wings-logo.png" alt={`${businessName} logo`} />
            <span>{businessName}</span>
          </Link>
          <div className="section-label">Booking Policy</div>
          <h1>Terms and Conditions</h1>
          <p>These terms apply to service enquiries and bookings made with The Wings Group in Agartala.</p>
        </div>
      </section>

      <section className="seo-content-section">
        <div className="container">
          <div className="seo-content-grid">
            <article>
              <h2>Service Booking</h2>
              <p>
                Bookings are accepted based on service availability, customer location, staff capacity, and confirmation by
                The Wings Group. The final schedule may be adjusted after customer confirmation.
              </p>

              <h2>Pricing and Payment</h2>
              <p>
                Displayed prices, offer prices, and discounts can vary by service scope, property condition, quantity, and
                location. Cash on delivery is available for eligible bookings. Online payment bookings are confirmed after
                successful payment verification.
              </p>

              <h2>Customer Responsibilities</h2>
              <p>
                Customers should provide correct contact details, service address, access instructions, and a safe working
                environment for the service team. Any special requirements should be shared before the appointment.
              </p>

              <h2>Cancellation and Rescheduling</h2>
              <p>
                Customers can request cancellation or rescheduling before the service team is dispatched. The Wings Group may
                reschedule bookings due to staff availability, weather, safety, or operational reasons.
              </p>

              <h2>Support</h2>
              <p>
                For booking support, call <a href={`tel:${businessPhone}`}>9774887803</a> or return to the{" "}
                <Link href="/">homepage</Link>.
              </p>
            </article>
            <aside className="seo-contact-card">
              <h2>Need help?</h2>
              <p>Contact The Wings Group before booking if you need clarification about a service, offer, or payment.</p>
              <a href={`tel:${businessPhone}`}>Call 9774887803</a>
              <a href="https://wa.me/919774887803">WhatsApp The Wings Group</a>
              <a href={siteUrl}>Back to Home</a>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
