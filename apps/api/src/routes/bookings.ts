import { Router } from "express";
import { bookingCreateSchema, bookingStatusUpdateSchema } from "@the-wings/validation";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { getAuthUserFromRequest } from "../services/auth.js";
import { sendWhatsAppText } from "../services/whatsapp.js";

export const bookingsRouter = Router();

function createBookingCode() {
  const date = new Date();
  const day = date.toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TWG-${day}-${random}`;
}

bookingsRouter.get("/", async (_req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        items: { include: { service: true } },
        payments: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: bookings });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get("/:bookingCode", async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { bookingCode: req.params.bookingCode },
      include: {
        items: true,
        payments: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.json({ data: booking });
  } catch (error) {
    return next(error);
  }
});

bookingsRouter.patch("/:bookingCode/status", async (req, res, next) => {
  try {
    const input = bookingStatusUpdateSchema.parse(req.body);
    const booking = await prisma.booking.update({
      where: { bookingCode: req.params.bookingCode },
      data: {
        status: input.status,
        assignedStaffId: input.assignedStaffId,
        statusLogs: {
          create: {
            status: input.status,
            note: input.note || `Status changed to ${input.status}`
          }
        }
      },
      include: {
        items: true,
        statusLogs: true
      }
    });

    return res.json({ data: booking });
  } catch (error) {
    return next(error);
  }
});

bookingsRouter.post("/", async (req, res, next) => {
  try {
    const input = bookingCreateSchema.parse(req.body);
    const authUser = await getAuthUserFromRequest(req);
    const bookingUserId = authUser?.id;

    if (authUser) {
      await prisma.user
        .update({
          where: { id: authUser.id },
          data: {
            name: authUser.name || input.customerName,
            phone: authUser.phone || input.customerPhone
          }
        })
        .catch(() =>
          prisma.user.update({
            where: { id: authUser.id },
            data: { name: authUser.name || input.customerName }
          })
        );
    }

    const booking = await prisma.booking.create({
      data: {
        bookingCode: createBookingCode(),
        userId: bookingUserId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        addressLine: input.addressLine,
        city: input.city,
        preferredDate: new Date(input.preferredDate),
        preferredTimeSlot: input.preferredTimeSlot,
        notes: input.notes,
        totalAmount: input.totalAmount,
        paymentMode: input.paymentMode,
        items: {
          create: input.items.map((item) => ({
            serviceId: item.serviceId,
            serviceName: item.serviceName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.quantity * item.unitPrice
          }))
        },
        statusLogs: {
          create: {
            status: "PENDING",
            note: "Booking created"
          }
        }
      },
      include: {
        items: true,
        statusLogs: true
      }
    });
    const customerMessage = [
      `Hi ${booking.customerName}, your Wings Group booking ${booking.bookingCode} has been received.`,
      `Service: ${booking.items.map((item) => item.serviceName).join(", ")}`,
      `Date: ${input.preferredDate} ${booking.preferredTimeSlot}`,
      `Total: Rs. ${booking.totalAmount.toLocaleString()}`,
      "Our team will contact you shortly."
    ].join("\n");

    sendWhatsAppText({ phone: booking.customerPhone, message: customerMessage }).catch((error) => {
      console.error("Customer WhatsApp notification failed", error);
    });

    if (env.WHATSAPP_ADMIN_PHONE) {
      const adminMessage = [
        `New booking ${booking.bookingCode}`,
        `Customer: ${booking.customerName} (${booking.customerPhone})`,
        `Services: ${booking.items.map((item) => item.serviceName).join(", ")}`,
        `Address: ${booking.addressLine}, ${booking.city}`,
        `Payment: ${booking.paymentMode} - Rs. ${booking.totalAmount.toLocaleString()}`
      ].join("\n");

      sendWhatsAppText({ phone: env.WHATSAPP_ADMIN_PHONE, message: adminMessage }).catch((error) => {
        console.error("Admin WhatsApp notification failed", error);
      });
    }

    res.status(201).json({ data: booking });
  } catch (error) {
    next(error);
  }
});
