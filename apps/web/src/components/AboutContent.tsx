import Link from "next/link";
import { SiteFooter } from "./CustomerHome";

export function AboutContent() {
  return (
    <>
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
            <div className="uc-nav-links">
              <Link className="uc-nav-link" href="/#services">Services</Link>
              <Link className="uc-nav-link active" href="/about">About</Link>
              <Link className="uc-nav-link" href="/#how">How it Works</Link>
              <Link className="btn-book-nav ms-2" href="/#services">Book a Service</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb-custom">
            <Link href="/">Home</Link>
            <i className="bi bi-chevron-right" />
            <span>About Us</span>
          </div>
          <div className="page-hero-eyebrow">🪽 Northeast India&apos;s Trusted Service Brand</div>
          <h1>About <span>The Wings Group</span></h1>
          <p>From home cleaning to security solutions — learn who we are, what drives us, and why Northeast families trust Wings.</p>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="container">
          <div className="row gy-5 align-items-start">
            <div className="col-lg-7">
              <div className="section-label mb-2">Who We Are</div>
              <h2 className="section-title mb-4">The Story Behind <span>Wings Group</span></h2>
              <p className="about-lead">
                Wings has become one of the most trusted e-commerce names in Northeast India. Under the leadership of <strong>CEO Prasanta Deb</strong>, the group is deeply focused on uncompromising customer service.
              </p>
              <p style={{ color: "var(--gray)", lineHeight: 1.85 }}>
                Being a dynamic and diversified business group, Wings is dedicated to making quality home care, security, and facility management accessible for every family.
              </p>
              <p style={{ color: "var(--gray)", lineHeight: 1.85 }}>
                Our team is trained, disciplined, and committed to delivering high-quality service using modern tools and efficient systems.
              </p>
              <div className="mt-4 mb-2" style={{ fontWeight: 800 }}>Our Core Services</div>
              <div>
                {["Professional Cleaning Services", "Security & Guard Services", "Home Care & Maintenance", "Facility Management Solutions"].map((service) => (
                  <Link className="core-service-pill" href="/#services" key={service}>{service}</Link>
                ))}
              </div>
            </div>
            <div className="col-lg-5">
              <div className="ceo-card mb-4">
                <div className="ceo-avatar">👨‍💼</div>
                <div className="ceo-name">Prasanta Deb</div>
                <div className="ceo-title">CEO & Founder · MBA (Retail & HR)</div>
                <div className="ceo-bio">With 10+ years of corporate experience, Prasanta founded The Wings Group with a singular vision — to bring world-class cleaning and security services to every home in Northeast India.</div>
              </div>
              <div className="row g-3">
                {[
                  ["5+", "Years of Excellence"],
                  ["500+", "Homes Served"],
                  ["4", "Core Verticals"],
                  ["NE", "India's Trust"]
                ].map(([num, label]) => (
                  <div className="col-6" key={label}>
                    <div className="about-stat-box text-center">
                      <div className="about-stat-num">{num}</div>
                      <div className="about-stat-label">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mvv-section" id="mvv">
        <div className="container">
          <div className="text-center mb-5">
            <div className="section-label mb-2">Our Foundation</div>
            <h2 className="section-title">Mission, Vision & <span>Values</span></h2>
          </div>
          <div className="row g-4">
            <MvvCard icon="bi-bullseye" title="Mission">
              To become the foremost leader in manpower security and cleaning while providing skilled manpower service with excellence and customer satisfaction.
            </MvvCard>
            <MvvCard icon="bi-sunrise" title="Vision">
              To become a trusted service brand in Northeast India, delivering quality care and creating employment opportunity for local communities.
            </MvvCard>
            <div className="col-lg-4">
              <div className="mvv-card">
                <div className="mvv-icon"><i className="bi bi-gem" /></div>
                <div className="mvv-title">Values</div>
                {[
                  ["Reliability", "Every team member displays integrity, transparency, and commitment.", "#22a96d"],
                  ["Vigilance", "We remain alert and attentive on every job.", "var(--sky)"],
                  ["Quality", "Hi-tech products, trained professionals, and stringent standards.", "var(--gold)"],
                  ["Adaptability", "We continuously improve our service portfolio.", "#e05c2a"]
                ].map(([label, desc, color]) => (
                  <div className="value-item" key={label}>
                    <div className="value-dot" style={{ background: color }} />
                    <div><div className="value-label">{label}</div><div className="value-desc">{desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-strip">
        <div className="container">
          <h2>Ready to experience the Wings difference?</h2>
          <p className="mx-auto mb-4">Book a service today — pay only after it&apos;s done. No advance. No risk.</p>
          <Link className="btn-cta-primary" href="/#services">Browse Services</Link>
          <Link className="btn-cta-outline" href="/#how">How it Works</Link>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}

function MvvCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="col-lg-4">
      <div className="mvv-card">
        <div className="mvv-icon"><i className={`bi ${icon}`} /></div>
        <div className="mvv-title">{title}</div>
        <div className="mvv-text">{children}</div>
      </div>
    </div>
  );
}
