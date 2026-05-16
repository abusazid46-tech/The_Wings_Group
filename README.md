# The Wings Group

Static website for The Wings Group, a Northeast India home-care, cleaning, AC servicing, security, and facility-management service brand.

## Pages

- `index.html` - homepage, service catalog, cart, and booking modal
- `about.html` - company story, mission, vision, values, and contact details
- `vercel.json` - Vercel static routing for `/` and `/about`

## Booking Flow

Customers choose one or more services, fill in their contact details, and confirm the booking. The site opens WhatsApp with a prefilled booking message to `+91 9774887803`, so the business receives the booking details directly.

## Deployment

This is a plain static site. It can be deployed to Vercel without a build step.

Vercel routes:

- `/` -> `/index.html`
- `/about` -> `/about.html`

## Local Preview

Open `index.html` in a browser, or serve the folder with any static file server.
