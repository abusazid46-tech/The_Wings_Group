const metrics = [
  { label: "Today's Bookings", value: "18" },
  { label: "Pending Leads", value: "42" },
  { label: "Revenue", value: "₹68.4k" },
  { label: "Active Services", value: "24" }
];

const bookings = [
  ["TWG-1042", "Deep Home Cleaning", "Confirmed", "₹2,299"],
  ["TWG-1041", "AC Regular Servicing", "Assigned", "₹499"],
  ["TWG-1040", "Sofa Cleaning", "Pending", "₹599"]
];

export default function AdminHomePage() {
  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand">The Wings Group</div>
        <a className="nav-item active" href="#">Dashboard</a>
        <a className="nav-item" href="#">Bookings</a>
        <a className="nav-item" href="#">Services</a>
        <a className="nav-item" href="#">Customers</a>
        <a className="nav-item" href="#">CRM Leads</a>
        <a className="nav-item" href="#">Payments</a>
      </aside>
      <section className="main">
        <div className="topbar">
          <div>
            <div className="eyebrow">Operations CRM</div>
            <h1>Bookings, customers, services, and revenue in one place.</h1>
          </div>
          <button className="primary-button">Add Service</button>
        </div>

        <div className="metric-grid">
          {metrics.map((metric) => (
            <div className="card" key={metric.label}>
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">{metric.value}</div>
            </div>
          ))}
        </div>

        <div className="work-grid">
          <div className="card">
            <h2>Recent Bookings</h2>
            <div className="table-row">
              <span>Booking</span>
              <span>Service</span>
              <span>Status</span>
              <span>Total</span>
            </div>
            {bookings.map(([code, service, status, total]) => (
              <div className="table-row" key={code}>
                <strong>{code}</strong>
                <span>{service}</span>
                <span className="status-pill">{status}</span>
                <strong>{total}</strong>
              </div>
            ))}
          </div>
          <div className="card">
            <h2>Milestone 1 Checklist</h2>
            <div className="task">
              <strong>UI Shell</strong>
              <span>Customer web UI converted, admin dashboard started.</span>
            </div>
            <div className="task">
              <strong>Backend Setup</strong>
              <span>API app, routes, validation, env config ready.</span>
            </div>
            <div className="task">
              <strong>Database</strong>
              <span>Prisma PostgreSQL schema covers services, bookings, users, CRM.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
