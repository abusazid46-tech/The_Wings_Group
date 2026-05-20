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

export type AuthUser = {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  googleId?: string | null;
  avatarUrl?: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type OtpRequestInput = {
  phone: string;
  name?: string;
};

export type OtpRequestResponse = {
  phone: string;
  expiresInSeconds: number;
  delivery: "whatsapp" | "queued" | "debug";
  whatsappUrl?: string;
  debugOtp?: string;
  message: string;
};

export type OtpVerifyInput = {
  phone: string;
  code: string;
  name?: string;
};

export type GoogleLoginInput = {
  credential: string;
};

export type Payment = {
  id: string;
  bookingId: string;
  provider: string;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  rawPayload?: unknown;
  createdAt: string;
  updatedAt: string;
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
  payments?: Payment[];
};

export type RazorpayOrderCreateInput = {
  bookingCode: string;
};

export type RazorpayOrderResponse = {
  bookingCode: string;
  paymentId?: string;
  provider: "RAZORPAY";
  keyId?: string;
  orderId: string;
  amount: number;
  currency: string;
  checkoutEnabled: boolean;
  message: string;
};

export type RazorpayVerifyInput = {
  bookingCode: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export type RazorpayVerifyResponse = {
  booking: Booking;
  payment: Payment;
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

export type WhatsappSendResponse = {
  data: WhatsappMessage;
  whatsappUrl: string;
  sent: boolean;
  providerMessageId?: string;
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
