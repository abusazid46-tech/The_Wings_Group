import type { ServiceIconKey } from "./ServiceIcon";

export type ServiceCategoryId = "toilet" | "tank" | "ac" | "sofa" | "kitchen" | "deep" | "pest" | "painter" | "salon" | "security";

export type ServiceItem = {
  id: string | number;
  serviceId?: string;
  category: ServiceCategoryId;
  categoryLabel?: string;
  iconKey: ServiceIconKey;
  name: string;
  description: string;
  price: number;
};

export const categoryLabels: Record<ServiceCategoryId, string> = {
  toilet: "Toilet & Bath",
  tank: "Tank",
  ac: "AC & Electric",
  sofa: "Sofa & Appliances",
  kitchen: "Kitchen & Appliances",
  deep: "Deep Clean Package",
  pest: "Pest Control",
  painter: "Painter & Plumber",
  salon: "Saloon & Spa",
  security: "Security"
};

export const services: ServiceItem[] = [
  {
    id: 1,
    category: "toilet",
    iconKey: "bathroom",
    name: "Shiney Toilet Cleaning",
    description: "Deep sanitization of toilet bowl, seat, flush, and surrounding area using professional-grade products.",
    price: 399
  },
  {
    id: 2,
    category: "toilet",
    iconKey: "bathroom",
    name: "Shiney Bathroom Cleaning",
    description: "Complete bathroom cleaning including tiles, floor, sink, mirror, and fixtures.",
    price: 299
  },
  {
    id: 3,
    category: "tank",
    iconKey: "tank",
    name: "Sintex Tank Wash (500 Ltr)",
    description: "Professional overhead tank cleaning and sanitization for 500-litre Sintex tanks.",
    price: 499
  },
  {
    id: 4,
    category: "tank",
    iconKey: "tank",
    name: "Sintex Tank Wash (1000 Ltr)",
    description: "Professional overhead tank cleaning and sanitization for 1000-litre Sintex tanks.",
    price: 699
  },
  {
    id: 5,
    category: "tank",
    iconKey: "tank",
    name: "Underground Tank Wash (Small)",
    description: "Thorough cleaning and disinfection of small underground water storage tanks.",
    price: 2500
  },
  {
    id: 6,
    category: "tank",
    iconKey: "tank",
    name: "Underground Tank Wash (Medium)",
    description: "Thorough cleaning and disinfection of medium underground water storage tanks.",
    price: 3000
  },
  {
    id: 7,
    category: "tank",
    iconKey: "tank",
    name: "Underground Tank Wash (Large)",
    description: "Thorough cleaning and disinfection of large underground water storage tanks.",
    price: 3500
  },
  {
    id: 8,
    category: "ac",
    iconKey: "ac",
    name: "AC Regular Servicing",
    description: "Filter cleaning, coil wash, gas pressure check, and performance tune-up for your AC unit.",
    price: 499
  },
  {
    id: 9,
    category: "ac",
    iconKey: "ac",
    name: "AC Special Servicing incl. Window",
    description: "Complete deep-service including window AC units with detailed internal cleaning.",
    price: 899
  },
  {
    id: 10,
    category: "ac",
    iconKey: "ac",
    name: "AC Gas Filling",
    description: "Refrigerant gas refilling service for optimal cooling performance and energy efficiency.",
    price: 2099
  },
  {
    id: 11,
    category: "ac",
    iconKey: "ac",
    name: "New AC Installation",
    description: "Professional installation of new split or window AC units with proper mounting and piping.",
    price: 1399
  },
  {
    id: 12,
    category: "ac",
    iconKey: "electrician",
    name: "New Fan / Light Install",
    description: "Quick and safe installation of ceiling fans or light fixtures by our electrician.",
    price: 200
  },
  {
    id: 13,
    category: "sofa",
    iconKey: "sofa",
    name: "Sofa Cleaning (Regular)",
    description: "Deep foam cleaning and stain removal for regular-sized sofas and fabric upholstery.",
    price: 599
  },
  {
    id: 14,
    category: "sofa",
    iconKey: "sofa",
    name: "Sofa Cleaning (Large)",
    description: "Full deep cleaning for large sectional or L-shaped sofas with odor treatment.",
    price: 899
  },
  {
    id: 15,
    category: "kitchen",
    iconKey: "kitchen",
    name: "Kitchen Chimney Wash",
    description: "Complete degreasing and cleaning of kitchen chimneys, filters, mesh, and motor.",
    price: 499
  },
  {
    id: 16,
    category: "kitchen",
    iconKey: "appliance",
    name: "Fridge & Refrigerator Cleaning",
    description: "Interior and exterior cleaning of refrigerator including shelves, drawers, and seals.",
    price: 99
  },
  {
    id: 17,
    category: "deep",
    iconKey: "home",
    name: "Deep Home Cleaning - 2BHK",
    description: "2 Bathrooms & Toilets, 1 Kitchen, 2 Living Rooms, Corridor & Fan Wash included.",
    price: 2299
  },
  {
    id: 18,
    category: "deep",
    iconKey: "home",
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

export const quickServices: Array<{ label: string; iconKey: ServiceIconKey; badge?: string; category: ServiceCategoryId }> = [
  { label: "Toilet & Bath", iconKey: "bathroom", badge: "Same Day", category: "toilet" },
  { label: "Tank Wash", iconKey: "tank", badge: "Same Day", category: "tank" },
  { label: "AC & Repair", iconKey: "ac", badge: "22 mins", category: "ac" },
  { label: "Sofa Clean", iconKey: "sofa", category: "sofa" },
  { label: "Deep Clean", iconKey: "home", category: "deep" },
  { label: "Kitchen & Appliances", iconKey: "kitchen", category: "kitchen" },
  { label: "Chimney Wash", iconKey: "kitchen", category: "kitchen" },
  { label: "Pest Control", iconKey: "pest", category: "pest" },
  { label: "Painter & Plumber", iconKey: "painting", category: "painter" },
  { label: "Saloon & Spa", iconKey: "salon", category: "salon" },
  { label: "Security", iconKey: "security", category: "security" }
];
