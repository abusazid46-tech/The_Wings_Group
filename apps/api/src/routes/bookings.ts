import { Router } from "express";
import { bookingCreateSchema, bookingStatusUpdateSchema } from "@the-wings/validation";
import { prisma } from "../db/prisma.js";

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
        items: true
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
    const booking = await prisma.booking.create({
      data: {
        bookingCode: createBookingCode(),
        userId: input.userId,
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
    res.status(201).json({ data: booking });
  } catch (error) {
    next(error);
  }
});
