import { Router } from "express";
import { bookingCreateSchema } from "@the-wings/validation";
import { prisma } from "../db/prisma.js";

export const bookingsRouter = Router();

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

bookingsRouter.post("/", async (req, res, next) => {
  try {
    const input = bookingCreateSchema.parse(req.body);
    const booking = await prisma.booking.create({
      data: {
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
