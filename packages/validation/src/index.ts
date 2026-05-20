import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

export const serviceCreateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  icon: z.string().optional(),
  imageUrl: z.string().url().optional(),
  basePrice: z.number().int().nonnegative(),
  durationMin: z.number().int().positive().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true)
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

export const bookingItemSchema = z.object({
  serviceId: z.string().optional(),
  serviceName: z.string().min(2),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative()
});

export const bookingCreateSchema = z.object({
  userId: z.string().optional(),
  customerName: z.string().min(2),
  customerPhone: phoneSchema,
  addressLine: z.string().min(8),
  city: z.string().min(2),
  preferredDate: z.string().min(8),
  preferredTimeSlot: z.string().min(3),
  notes: z.string().optional(),
  paymentMode: z.enum(["COD", "RAZORPAY", "STRIPE"]).default("COD"),
  totalAmount: z.number().int().nonnegative(),
  items: z.array(bookingItemSchema).min(1)
});

export const otpRequestSchema = z.object({
  phone: phoneSchema,
  name: z.string().trim().min(2).optional()
});

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
  name: z.string().trim().min(2).optional()
});

export const googleLoginSchema = z.object({
  credential: z.string().min(20, "Google credential is required")
});

export const bookingStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED"]),
  note: z.string().optional(),
  assignedStaffId: z.string().optional()
});

export const leadCreateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: phoneSchema,
  email: z.string().email().optional(),
  source: z.string().min(2).optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]).default("NEW"),
  notes: z.string().optional()
});

export const leadUpdateSchema = leadCreateSchema.partial();

export const crmNoteCreateSchema = z.object({
  userId: z.string().optional(),
  title: z.string().min(2),
  body: z.string().min(2)
});

export const whatsappMessageCreateSchema = z.object({
  phone: phoneSchema,
  template: z.string().optional(),
  direction: z.enum(["OUTBOUND", "INBOUND"]).default("OUTBOUND"),
  status: z.string().default("QUEUED"),
  message: z.string().min(1)
});

export const razorpayOrderCreateSchema = z.object({
  bookingCode: z.string().min(4)
});

export const razorpayVerifySchema = z.object({
  bookingCode: z.string().min(4),
  razorpayOrderId: z.string().min(4),
  razorpayPaymentId: z.string().min(4),
  razorpaySignature: z.string().min(10)
});

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type BookingStatusUpdateInput = z.infer<typeof bookingStatusUpdateSchema>;
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type CrmNoteCreateInput = z.infer<typeof crmNoteCreateSchema>;
export type WhatsappMessageCreateInput = z.infer<typeof whatsappMessageCreateSchema>;
export type RazorpayOrderCreateInput = z.infer<typeof razorpayOrderCreateSchema>;
export type RazorpayVerifyInput = z.infer<typeof razorpayVerifySchema>;
