export type ServiceCategoryId = "toilet" | "tank" | "ac" | "sofa" | "deep";

export type ServiceItem = {
  id: number;
  category: ServiceCategoryId;
  iconClass: string;
  name: string;
  description: string;
  price: number;
};

export const categoryLabels: Record<ServiceCategoryId, string> = {
  toilet: "Toilet & Bath",
  tank: "Tank",
  ac: "AC & Electric",
  sofa: "Sofa & Appliances",
  deep: "Deep Clean Package"
};

export const services: ServiceItem[] = [
  {
    id: 1,
    category: "toilet",
    iconClass: "bi-stars",
    name: "Shiney Toilet Cleaning",
    description: "Deep sanitization of toilet bowl, seat, flush, and surrounding area using professional-grade products.",
    price: 399
  },
  {
    id: 2,
    category: "toilet",
    iconClass: "bi-droplet-half",
    name: "Shiney Bathroom Cleaning",
    description: "Complete bathroom cleaning including tiles, floor, sink, mirror, and fixtures.",
    price: 299
  },
  {
    id: 3,
    category: "tank",
    iconClass: "bi-droplet-fill",
    name: "Sintex Tank Wash (500 Ltr)",
    description: "Professional overhead tank cleaning and sanitization for 500-litre Sintex tanks.",
    price: 499
  },
  {
    id: 4,
    category: "tank",
    iconClass: "bi-droplet-fill",
    name: "Sintex Tank Wash (1000 Ltr)",
    description: "Professional overhead tank cleaning and sanitization for 1000-litre Sintex tanks.",
    price: 699
  },
  {
    id: 5,
    category: "tank",
    iconClass: "bi-water",
    name: "Underground Tank Wash (Small)",
    description: "Thorough cleaning and disinfection of small underground water storage tanks.",
    price: 2500
  },
  {
    id: 6,
    category: "tank",
    iconClass: "bi-water",
    name: "Underground Tank Wash (Medium)",
    description: "Thorough cleaning and disinfection of medium underground water storage tanks.",
    price: 3000
  },
  {
    id: 7,
    category: "tank",
    iconClass: "bi-water",
    name: "Underground Tank Wash (Large)",
    description: "Thorough cleaning and disinfection of large underground water storage tanks.",
    price: 3500
  },
  {
    id: 8,
    category: "ac",
    iconClass: "bi-snow",
    name: "AC Regular Servicing",
    description: "Filter cleaning, coil wash, gas pressure check, and performance tune-up for your AC unit.",
    price: 499
  },
  {
    id: 9,
    category: "ac",
    iconClass: "bi-wind",
    name: "AC Special Servicing incl. Window",
    description: "Complete deep-service including window AC units with detailed internal cleaning.",
    price: 899
  },
  {
    id: 10,
    category: "ac",
    iconClass: "bi-cloud-haze2-fill",
    name: "AC Gas Filling",
    description: "Refrigerant gas refilling service for optimal cooling performance and energy efficiency.",
    price: 2099
  },
  {
    id: 11,
    category: "ac",
    iconClass: "bi-tools",
    name: "New AC Installation",
    description: "Professional installation of new split or window AC units with proper mounting and piping.",
    price: 1399
  },
  {
    id: 12,
    category: "ac",
    iconClass: "bi-lightbulb-fill",
    name: "New Fan / Light Install",
    description: "Quick and safe installation of ceiling fans or light fixtures by our electrician.",
    price: 200
  },
  {
    id: 13,
    category: "sofa",
    iconClass: "bi-grid-1x2-fill",
    name: "Sofa Cleaning (Regular)",
    description: "Deep foam cleaning and stain removal for regular-sized sofas and fabric upholstery.",
    price: 599
  },
  {
    id: 14,
    category: "sofa",
    iconClass: "bi-grid-1x2-fill",
    name: "Sofa Cleaning (Large)",
    description: "Full deep cleaning for large sectional or L-shaped sofas with odor treatment.",
    price: 899
  },
  {
    id: 15,
    category: "sofa",
    iconClass: "bi-fire",
    name: "Kitchen Chimney Wash",
    description: "Complete degreasing and cleaning of kitchen chimneys, filters, mesh, and motor.",
    price: 499
  },
  {
    id: 16,
    category: "sofa",
    iconClass: "bi-box-seam-fill",
    name: "Fridge & Refrigerator Cleaning",
    description: "Interior and exterior cleaning of refrigerator including shelves, drawers, and seals.",
    price: 99
  },
  {
    id: 17,
    category: "deep",
    iconClass: "bi-house-heart-fill",
    name: "Deep Home Cleaning - 2BHK",
    description: "2 Bathrooms & Toilets, 1 Kitchen, 2 Living Rooms, Corridor & Fan Wash included.",
    price: 2299
  },
  {
    id: 18,
    category: "deep",
    iconClass: "bi-house-heart",
    name: "Deep Home Cleaning - 3BHK",
    description: "2 Bathrooms & Toilets, 1 Kitchen, 3 Living Rooms, Corridor & Fan Wash included.",
    price: 2699
  }
];

export const searchTerms = [
  "Bathroom Cleaning",
  "Sofa Cleaning",
  "AC Repairing",
  "Tank Cleaning",
  "Deep Home Cleaning",
  "Kitchen Chimney Wash"
];

export const quickServices = [
  { label: "Toilet & Bath", iconClass: "bi-stars", badge: "Same Day", query: "Toilet Cleaning", price: 399 },
  { label: "Tank Wash", iconClass: "bi-droplet-fill", badge: "Same Day", query: "Tank Wash", price: 499 },
  { label: "AC & Repair", iconClass: "bi-snow", badge: "22 mins", query: "AC Servicing", price: 499 },
  { label: "Sofa Clean", iconClass: "bi-grid-1x2-fill", query: "Sofa Cleaning", price: 599 },
  { label: "Deep Clean", iconClass: "bi-house-heart-fill", query: "Deep Home Cleaning 2BHK", price: 2299 },
  { label: "Fridge Clean", iconClass: "bi-box-seam-fill", query: "Fridge Cleaning", price: 99 },
  { label: "Chimney Wash", iconClass: "bi-fire", query: "Kitchen Chimney Wash", price: 499 },
  { label: "Security", iconClass: "bi-shield-check", query: "Security", price: 0, scrollOnly: true }
];
