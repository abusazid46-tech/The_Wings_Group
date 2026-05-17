export type UserRole = "CUSTOMER" | "ADMIN" | "MANAGER" | "STAFF";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMode = "COD" | "RAZORPAY" | "STRIPE";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type Service = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  icon?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  durationMin?: number | null;
  sortOrder: number;
  isActive: boolean;
};

export type BookingItemInput = {
  serviceId?: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
};

export type BookingCreateInput = {
  userId?: string;
  customerName: string;
  customerPhone: string;
  addressLine: string;
  city: string;
  preferredDate: string;
  preferredTimeSlot: string;
  notes?: string;
  paymentMode: PaymentMode;
  totalAmount: number;
  items: BookingItemInput[];
};

export type BookingItem = {
  id: string;
  serviceId?: string | null;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Booking = {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  addressLine: string;
  city: string;
  preferredDate: string;
  preferredTimeSlot: string;
  notes?: string | null;
  status: BookingStatus;
  paymentMode: PaymentMode;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: BookingItem[];
};
