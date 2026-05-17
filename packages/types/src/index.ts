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
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";

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

export type BookingStatusUpdateInput = {
  status: BookingStatus;
  note?: string;
  assignedStaffId?: string;
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

export type ServiceCreateInput = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  basePrice: number;
  durationMin?: number;
  sortOrder?: number;
  isActive?: boolean;
};

export type ServiceUpdateInput = Partial<ServiceCreateInput>;

export type Lead = {
  id: string;
  name?: string | null;
  phone: string;
  email?: string | null;
  source?: string | null;
  status: LeadStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadCreateInput = {
  name?: string;
  phone: string;
  email?: string;
  source?: string;
  status?: LeadStatus;
  notes?: string;
};

export type LeadUpdateInput = Partial<LeadCreateInput>;

export type CrmNote = {
  id: string;
  userId?: string | null;
  title: string;
  body: string;
  createdAt: string;
};

export type CrmNoteCreateInput = {
  userId?: string;
  title: string;
  body: string;
};

export type WhatsappMessage = {
  id: string;
  phone: string;
  template?: string | null;
  direction: string;
  status: string;
  payload?: unknown;
  createdAt: string;
};

export type WhatsappMessageCreateInput = {
  phone: string;
  template?: string;
  direction?: "OUTBOUND" | "INBOUND";
  status?: string;
  message: string;
};

export type CustomerSummary = {
  name: string;
  phone: string;
  bookingsCount: number;
  totalSpend: number;
  lastBookingAt: string;
  lastService: string;
  city: string;
  status: BookingStatus;
};

export type AdminDashboard = {
  metrics: {
    todayBookings: number;
    pendingBookings: number;
    monthRevenue: number;
    activeServices: number;
    openLeads: number;
    customers: number;
  };
  recentBookings: Booking[];
  hotLeads: Lead[];
  customers: CustomerSummary[];
};
