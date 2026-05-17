"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { categoryLabels, quickServices, searchTerms, services, type ServiceCategoryId, type ServiceItem } from "./site-data";

type CartItem = ServiceItem & { quantity: number };
type LocationChoice = { label: string; address: string; coords?: string };

const categories: Array<{ id: "all" | ServiceCategoryId; label: string; iconClass: string }> = [
  { id: "all", label: "All Services", iconClass: "bi-grid-fill" },
  { id: "toilet", label: "Toilet & Bath", iconClass: "bi-stars" },
  { id: "tank", label: "Tank", iconClass: "bi-droplet-fill" },
  { id: "ac", label: "AC & Electric", iconClass: "bi-snow" },
  { id: "sofa", label: "Sofa & Appliances", iconClass: "bi-grid-1x2-fill" },
  { id: "deep", label: "Deep Clean", iconClass: "bi-house-heart-fill" }
];

const initialForm = {
  name: "",
  phone: "",
  address: "",
  date: "",
  time: "",
  note: ""
};

export function CustomerHome() {
  const [placeholder, setPlaceholder] = useState("Search for 'Bathroom Cleaning'");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [location, setLocation] = useState<LocationChoice>({
    label: "Agartala, Tripura",
    address: "Agartala, Tripura"
  });
  const [category, setCategory] = useState<"all" | ServiceCategoryId>("all");
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [form, setForm] = useState(initialForm);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  useEffect(() => {
    let termIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    function tick() {
      const term = searchTerms[termIndex] ?? "Bathroom Cleaning";
      setPlaceholder(`Search for '${term.slice(0, charIndex)}'`);

      if (!deleting && charIndex === term.length) {
        deleting = true;
        timeout = setTimeout(tick, 1200);
        return;
      }

      if (deleting && charIndex === 0) {
        deleting = false;
        termIndex = (termIndex + 1) % searchTerms.length;
        timeout = setTimeout(tick, 250);
        return;
      }

      charIndex += deleting ? -1 : 1;
      timeout = setTimeout(tick, deleting ? 45 : 85);
    }

    tick();
    return () => clearTimeout(timeout);
  }, []);

  const filteredServices = useMemo(
    () => (category === "all" ? services : services.filter((service) => service.category === category)),
    [category]
  );

  const cartItems = Object.values(cart);
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addService(service: ServiceItem) {
    setCart((current) => {
      const existing = current[service.id];
      return {
        ...current,
        [service.id]: existing ? { ...existing, quantity: existing.quantity + 1 } : { ...service, quantity: 1 }
      };
    });
  }

  function quickBook(query: string, fallbackPrice: number, scrollOnly?: boolean) {
    if (scrollOnly) {
      document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const service =
      services.find((item) => item.name.toLowerCase().includes(query.toLowerCase().split(" ")[0] ?? query.toLowerCase())) ??
      ({
        id: 999,
        category: "deep",
        iconClass: "bi-stars",
        name: query,
        description: "",
        price: fallbackPrice
      } satisfies ServiceItem);

    setCart({ [service.id]: { ...service, quantity: 1 } });
    setSuccess(false);
    setBookingModalOpen(true);
  }

  function openCart() {
    setSuccess(false);
    setBookingModalOpen(true);
  }

  function selectLocation(choice: LocationChoice) {
    setLocation(choice);
    setForm((current) => ({
      ...current,
      address: current.address || choice.address
    }));
    setLocationStatus(`Service location set to ${choice.label}.`);
    setLocationModalOpen(false);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Current location is not supported on this browser. Please enter your address manually.");
      return;
    }

    setLocationStatus("Getting your current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
        selectLocation({
          label: "Current location",
          address: `Current location coordinates: ${coords}`,
          coords
        });
      },
      () => setLocationStatus("Location permission was denied. Search or type your address manually."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function confirmBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name || !form.phone || !form.address || !form.date || !form.time) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      alert("Enter a valid 10-digit phone number.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Please add at least one service.");
      return;
    }

    const bookingId = `TWG${Date.now().toString().slice(-6)}`;
    const serviceSummary = cartItems.map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`).join(", ");
    const whatsappMessage = [
      `New Booking - ${bookingId}`,
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Address: ${form.address}`,
      `Services: ${serviceSummary}`,
      `Preferred Date & Time: ${form.date} ${form.time}`,
      `Total (Cash on Delivery): ₹${total.toLocaleString()}`,
      form.note ? `Instructions: ${form.note}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    setBookingRef(
      [
        `Booking ID: ${bookingId}`,
        `Name: ${form.name}`,
        `Phone: ${form.phone}`,
        `Services: ${serviceSummary}`,
        `Date & Time: ${form.date} · ${form.time}`,
        `Total (Cash on Delivery): ₹${total.toLocaleString()}`
      ].join("\n")
    );
    setSuccess(true);
    window.open(`https://wa.me/919774887803?text=${encodeURIComponent(whatsappMessage)}`, "_blank", "noopener");
    setCart({});
  }

  return (
    <>
      <Navbar
        placeholder={placeholder}
        location={location}
        cartCount={cartItems.length}
        onOpenCart={openCart}
        onOpenLocation={() => setLocationModalOpen(true)}
      />
      <PromoPanel />
      <Hero onQuickBook={quickBook} />
      <TrustBar />
      <ServicesSection category={category} onCategoryChange={setCategory} services={filteredServices} cart={cart} onAdd={addService} />
      <HowItWorks />
      <AboutTeaser />
      <CodSection />
      <SiteFooter />

      {locationModalOpen && (
        <LocationModal
          status={locationStatus}
          onClose={() => setLocationModalOpen(false)}
          onUseCurrent={useCurrentLocation}
          onSelect={selectLocation}
        />
      )}

      {bookingModalOpen && (
        <BookingModal
          cartItems={cartItems}
          total={total}
          form={form}
          success={success}
          bookingRef={bookingRef}
          onClose={() => setBookingModalOpen(false)}
          onSubmit={confirmBooking}
          onFormChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
        />
      )}
    </>
  );
}

function Navbar({
  placeholder,
  location,
  cartCount,
  onOpenCart,
  onOpenLocation
}: {
  placeholder: string;
  location: LocationChoice;
  cartCount: number;
  onOpenCart: () => void;
  onOpenLocation: () => void;
}) {
  return (
    <nav className="navbar">
      <div className="container-fluid">
        <div className="navbar-inner">
          <Link className="brand-wrap" href="/">
            <div className="brand-icon-uc">🪽</div>
            <div>
              <div className="brand-name-uc">Wings Group</div>
              <div className="brand-sub-uc">Northeast India</div>
            </div>
          </Link>

          <button className="uc-location-pill" type="button" onClick={onOpenLocation} aria-label="Choose service location">
            <i className="bi bi-geo-alt-fill" />
            <span className="uc-location-text">
              <span className="uc-location-eta">{location.coords ? "Current location" : "In 14 minutes"}</span>
              <span className="uc-location-label">{location.label}</span>
            </span>
            <i className="bi bi-chevron-down loc-caret" />
          </button>

          <div className="uc-search-wrap">
            <i className="bi bi-search" />
            <input type="text" className="uc-search-input" placeholder={placeholder} aria-label="Search services" />
          </div>

          <div className="uc-nav-links">
            <a className="uc-nav-link" href="#services">Services</a>
            <Link className="uc-nav-link" href="/about">About</Link>
            <a className="uc-nav-link" href="#how">How it Works</a>
            <button className="uc-cart-icon ms-1" onClick={onOpenCart} type="button" title="Cart">
              <i className="bi bi-cart3" />
              {cartCount > 0 && <span className="uc-cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function PromoPanel() {
  return (
    <section className="promo-panel" aria-label="Limited time service offer">
      <div className="container">
        <div className="promo-panel-inner">
          <div className="promo-copy">
            <div className="promo-price">just ₹99 <del>₹245</del></div>
            <div className="promo-offer">60% OFF</div>
            <a className="promo-action" href="#services">Book now <i className="bi bi-arrow-right" /></a>
          </div>
          <img
            className="promo-image"
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=85&fit=crop&crop=center"
            alt="Professional home cleaning offer"
          />
        </div>
      </div>
    </section>
  );
}

function Hero({ onQuickBook }: { onQuickBook: (query: string, price: number, scrollOnly?: boolean) => void }) {
  return (
    <section className="uc-hero">
      <div className="container">
        <div className="row align-items-center gy-4">
          <div className="col-lg-6 uc-hero-left">
            <div className="uc-hero-eyebrow">🪽 Agartala&apos;s #1 Home Services</div>
            <h1 className="uc-hero-h1">Home services<br />at your <em>doorstep</em></h1>
            <p className="uc-hero-sub">Professional cleaning, AC servicing, tank washing, security and more — booked in seconds. Pay only after the job is done.</p>

            <div className="uc-service-grid">
              <div className="uc-service-grid-title">Book a service</div>
              <div className="uc-svc-row">
                {quickServices.map((service) => (
                  <button
                    className="uc-svc-item"
                    key={service.label}
                    type="button"
                    onClick={() => onQuickBook(service.query, service.price, service.scrollOnly)}
                  >
                    <div className="uc-svc-icon-wrap">
                      <i className={`bi ${service.iconClass}`} />
                      {service.badge && <span className="uc-time-badge">{service.badge}</span>}
                    </div>
                    <div className="uc-svc-name">{service.label}</div>
                  </button>
                ))}
              </div>
              <div className="uc-cod-strip">
                <i className="bi bi-cash-coin" />
                <span>100% Cash on Delivery — No advance payment required</span>
              </div>
            </div>

            <div className="uc-stats-row">
              {[
                ["500+", "Happy Homes"],
                ["5+", "Years of Trust"],
                ["4.8★", "Avg Rating"],
                ["COD", "Cash on Delivery"]
              ].map(([num, label], index) => (
                <div className="d-flex align-items-center gap-3" key={label}>
                  {index > 0 && <div className="uc-stat-divider" />}
                  <div className="uc-stat-item">
                    <div className="uc-stat-num">{num}</div>
                    <div className="uc-stat-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="uc-hero-photos">
              {[
                ["uc-photo-1", "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=700&q=85&fit=crop&crop=center", "🧹 Deep Cleaning"],
                ["uc-photo-2", "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=700&q=85&fit=crop&crop=top", "❄️ AC Servicing"],
                ["uc-photo-3", "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=85&fit=crop&crop=center", "🛋️ Sofa Cleaning"],
                ["uc-photo-4", "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&q=85&fit=crop&crop=center", "🛡️ Security & Facility Services"]
              ].map(([className, src, label]) => (
                <div className={`uc-photo ${className}`} key={label}>
                  <img src={src} alt={label} />
                  <div className="uc-photo-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <div className="trust-bar">
      <div className="container">
        <div className="row gy-2 text-center text-md-start justify-content-center">
          {[
            ["bi-shield-check", "Verified Professionals"],
            ["bi-cash-coin", "Pay on Delivery"],
            ["bi-clock", "Same Day Booking"],
            ["bi-star-fill", "Satisfaction Guaranteed"]
          ].map(([icon, label]) => (
            <div className="col-6 col-md-3 d-flex justify-content-center" key={label}>
              <div className="trust-item"><div className="trust-icon"><i className={`bi ${icon}`} /></div>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesSection({
  category,
  onCategoryChange,
  services: visibleServices,
  cart,
  onAdd
}: {
  category: "all" | ServiceCategoryId;
  onCategoryChange: (category: "all" | ServiceCategoryId) => void;
  services: ServiceItem[];
  cart: Record<number, CartItem>;
  onAdd: (service: ServiceItem) => void;
}) {
  return (
    <section className="services-section" id="services">
      <div className="container">
        <div className="text-center mb-5">
          <div className="section-label">Our Services</div>
          <h2 className="section-title">Everything Your Home Needs,<br /><span>Under One Wing</span></h2>
        </div>
        <div className="text-center mb-4">
          {categories.map((item) => (
            <button className={`category-tab ${category === item.id ? "active" : ""}`} key={item.id} onClick={() => onCategoryChange(item.id)} type="button">
              <i className={`bi ${item.iconClass} me-2`} /> {item.label}
            </button>
          ))}
        </div>
        <div className="row g-4">
          {visibleServices.map((service) => (
            <div className="col-sm-6 col-lg-4" key={service.id}>
              <div className="service-card">
                <div className="card-icon-wrap">
                  <i className={`bi ${service.iconClass}`} style={{ fontSize: 52 }} />
                  <span className="card-category-badge">{categoryLabels[service.category]}</span>
                </div>
                <div className="card-body-custom">
                  <div className="card-service-name">{service.name}</div>
                  <div className="card-desc">{service.description}</div>
                  <div className="mt-3 d-flex justify-content-between align-items-end">
                    <div className="card-price">₹{service.price.toLocaleString()}<span>/visit</span></div>
                    <button className={`btn-add-cart ${cart[service.id] ? "added" : ""}`} onClick={() => onAdd(service)} type="button">
                      {cart[service.id] ? "✓ Added" : "+ Add"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how-section" id="how">
      <div className="container">
        <div className="text-center mb-5">
          <div className="section-label">How It Works</div>
          <h2 className="section-title">Book in <span>3 Easy Steps</span></h2>
        </div>
        <div className="row g-4">
          {[
            ["1", "Choose Services", "Pick the cleaning, AC, tank, or security service you need from our catalog."],
            ["2", "Fill Your Details", "Enter your name, phone number, address, and preferred date and time."],
            ["3", "Pay on Delivery", "Our professional arrives on time. Service done. Pay in cash after completion."]
          ].map(([num, title, desc]) => (
            <div className="col-md-4" key={num}>
              <div className="step-item">
                <div className="step-num">{num}</div>
                <div className="step-title">{title}</div>
                <div className="step-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutTeaser() {
  return (
    <section className="about-teaser">
      <div className="container">
        <div className="about-teaser-inner">
          <div className="about-teaser-text">
            <h2>5+ Years of Trust.<br /><span>Northeast India&apos;s Own.</span></h2>
            <p>Under CEO Prasanta Deb, Wings Group has become the region&apos;s most dependable home services brand — built on reliability, quality, and a genuine commitment to every family we serve.</p>
            <div className="about-teaser-pills">
              {["Clear Mission", "Bold Vision", "4 Core Values", "MBA-led Leadership"].map((pill) => <span className="about-pill" key={pill}>{pill}</span>)}
            </div>
          </div>
          <Link className="btn-about" href="/about">Meet the Team →</Link>
        </div>
      </div>
    </section>
  );
}

function CodSection() {
  return (
    <section className="cod-section" id="cod">
      <div className="container">
        <div className="row align-items-center gy-5">
          <div className="col-lg-6">
            <div className="section-label" style={{ color: "var(--gold-light)" }}>Payment Policy</div>
            <h2 className="section-title" style={{ color: "white", marginBottom: 30 }}>Cash on Delivery —<br /><span style={{ color: "var(--gold-light)" }}>Zero Risk, Zero Advance</span></h2>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.75, maxWidth: 440 }}>We believe you should only pay after you&apos;re satisfied. No online payment, no UPI advance required. Just book, we show up, we clean, you pay.</p>
          </div>
          <div className="col-lg-6">
            {[
              ["bi-cash-coin", "100% Cash on Delivery", "Pay only after the service is completed at your doorstep."],
              ["bi-calendar2-check", "Flexible Scheduling", "Book for today or plan ahead. Choose a time slot that works for you."],
              ["bi-shield-lock", "Verified Staff", "All our team members are verified, trained, and trustworthy professionals."],
              ["bi-recycle", "Eco-Friendly Products", "Safe cleaning agents that are suitable for families and homes."]
            ].map(([icon, title, desc]) => (
              <div className="cod-feature" key={title}>
                <div className="cod-icon"><i className={`bi ${icon}`} /></div>
                <div className="cod-text"><h6>{title}</h6><p>{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer id="contact">
      <div className="container">
        <div className="row gy-5">
          <div className="col-lg-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="brand-icon-uc">🪽</div>
              <div>
                <div className="footer-brand-name">The Wings Group</div>
                <div className="footer-tag">Home Care to Security — All Under One Wing</div>
              </div>
            </div>
            <div className="footer-desc">Northeast India&apos;s trusted name in cleaning, security, and facility management. Serving Agartala and surrounding areas.</div>
          </div>
          <div className="col-6 col-lg-2">
            <div className="footer-heading">Services</div>
            {["Toilet & Bath Cleaning", "Tank Cleaning", "AC Servicing", "Sofa Cleaning", "Deep Home Cleaning", "Security Services"].map((link) => (
              <a className="footer-link" href="#services" key={link}>{link}</a>
            ))}
          </div>
          <div className="col-6 col-lg-2">
            <div className="footer-heading">Company</div>
            <Link className="footer-link" href="/about">About Us</Link>
            <Link className="footer-link" href="/about#mvv">Mission & Values</Link>
            <a className="footer-link" href="#how">How it Works</a>
            <a className="footer-link" href="https://wa.me/919774887803?text=Hi%20Wings%20Group%2C%20I%27d%20like%20to%20know%20about%20career%20opportunities.">Careers</a>
            <a className="footer-link" href="#contact">T&C Apply</a>
          </div>
          <div className="col-lg-4">
            <div className="footer-heading">Contact Us</div>
            <div className="footer-desc mb-3"><i className="bi bi-geo-alt me-2" />Post Office Chowmuhani, Opp. Sarkar Nursing Home, Agartala</div>
            <div className="footer-desc mb-3"><i className="bi bi-telephone me-2" />9774887803</div>
            <a className="footer-link" href="https://wa.me/919774887803"><i className="bi bi-whatsapp me-2" />WhatsApp Us</a>
          </div>
        </div>
        <div className="footer-bottom">© 2026 The Wings Group. All rights reserved. · T&C Apply · Cash on Delivery Only</div>
      </div>
    </footer>
  );
}

function LocationModal({
  status,
  onClose,
  onUseCurrent,
  onSelect
}: {
  status: string;
  onClose: () => void;
  onUseCurrent: () => void;
  onSelect: (choice: LocationChoice) => void;
}) {
  const [manual, setManual] = useState("");
  const recents: LocationChoice[] = [
    { label: "Post Office Chowmuhani", address: "Opp. Sarkar Nursing Home, Agartala, Tripura" },
    { label: "HGB Road", address: "Agartala, Tripura, India" }
  ];

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = manual.trim();
    if (value) onSelect({ label: value, address: value });
  }

  return (
    <div className="app-modal-backdrop">
      <div className="location-modal-card">
        <div className="location-picker-head">
          <form className="location-search-row" onSubmit={submitManual}>
            <button className="location-back-btn" type="button" onClick={onClose} aria-label="Close location picker">
              <i className="bi bi-arrow-left" />
            </button>
            <input className="location-input" value={manual} onChange={(event) => setManual(event.target.value)} placeholder="Search for your location/society/apartment" />
          </form>
        </div>
        <button className="location-use-btn" type="button" onClick={onUseCurrent}>
          <i className="bi bi-crosshair" />
          <span>Use current location</span>
        </button>
        <div className="location-status">{status}</div>
        <div className="location-recents">
          <div className="location-section-title">Recents</div>
          {recents.map((recent) => (
            <button className="recent-location-btn" type="button" key={recent.label} onClick={() => onSelect(recent)}>
              <span className="recent-location-icon"><i className="bi bi-clock-history" /></span>
              <span>
                <span className="recent-location-name">{recent.label}</span>
                <span className="recent-location-address">{recent.address}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookingModal({
  cartItems,
  total,
  form,
  success,
  bookingRef,
  onClose,
  onSubmit,
  onFormChange
}: {
  cartItems: CartItem[];
  total: number;
  form: typeof initialForm;
  success: boolean;
  bookingRef: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (field: keyof typeof initialForm, value: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0] ?? "";

  return (
    <div className="app-modal-backdrop">
      <div className="app-modal">
        <div className="modal-header-custom d-flex justify-content-between align-items-start">
          <div>
            <h5 className="mb-1">🪽 Book Your Service</h5>
            <div className="uc-cod-strip p-0" style={{ background: "transparent", color: "var(--gold-light)" }}>
              <i className="bi bi-cash-coin" /> Cash on Delivery
            </div>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {success ? (
            <div className="success-overlay">
              <div className="success-icon">✅</div>
              <h4>Booking Confirmed!</h4>
              <p>Thank you! Our team will call you shortly to confirm your appointment.<br /><br /><strong>Reminder: Pay only in cash after service is completed.</strong></p>
              {bookingRef && <pre className="booking-summary text-start w-100" style={{ whiteSpace: "pre-wrap" }}>{bookingRef}</pre>}
              <button className="btn-confirm mt-3" type="button" onClick={onClose}>Done</button>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <div className="booking-summary">
                <div style={{ fontWeight: 800, marginBottom: 10, fontSize: "0.9rem" }}>🛒 Your Services</div>
                {cartItems.length === 0 ? (
                  <div style={{ color: "var(--gray)", fontSize: "0.85rem", textAlign: "center", padding: 10 }}>No services added yet. Close and pick services.</div>
                ) : (
                  <>
                    {cartItems.map((item) => (
                      <div className="item-row" key={item.id}>
                        <span>{item.name} {item.quantity > 1 ? `x${item.quantity}` : ""}</span>
                        <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="item-row"><span>Total</span><span style={{ color: "var(--sky)" }}>₹{total.toLocaleString()}</span></div>
                  </>
                )}
              </div>
              <div className="row g-3">
                <Field label="Full Name *" value={form.name} onChange={(value) => onFormChange("name", value)} placeholder="Your full name" />
                <Field label="Phone Number *" value={form.phone} onChange={(value) => onFormChange("phone", value)} placeholder="10-digit mobile number" type="tel" />
                <div className="col-12">
                  <label className="form-label-custom">Address *</label>
                  <textarea className="form-control form-control-custom" value={form.address} onChange={(event) => onFormChange("address", event.target.value)} rows={2} placeholder="Full address with landmark" />
                </div>
                <Field label="Preferred Date *" value={form.date || today} onChange={(value) => onFormChange("date", value)} type="date" min={today} />
                <div className="col-md-6">
                  <label className="form-label-custom">Preferred Time *</label>
                  <select className="form-control form-control-custom" value={form.time} onChange={(event) => onFormChange("time", event.target.value)}>
                    <option value="">Select time slot</option>
                    <option>9:00 AM - 11:00 AM</option>
                    <option>11:00 AM - 1:00 PM</option>
                    <option>1:00 PM - 3:00 PM</option>
                    <option>3:00 PM - 5:00 PM</option>
                    <option>5:00 PM - 7:00 PM</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label-custom">Special Instructions (optional)</label>
                  <textarea className="form-control form-control-custom" value={form.note} onChange={(event) => onFormChange("note", event.target.value)} rows={1} placeholder="Any specific requirements..." />
                </div>
              </div>
              <button className="btn-confirm mt-4 w-100" type="submit">Confirm Booking — Pay on Delivery 💵</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
}) {
  return (
    <div className="col-md-6">
      <label className="form-label-custom">{label}</label>
      <input className="form-control form-control-custom" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} min={min} />
    </div>
  );
}
