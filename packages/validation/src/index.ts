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

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
