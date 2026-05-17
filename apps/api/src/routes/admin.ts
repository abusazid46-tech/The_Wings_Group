import { Router } from "express";
import { prisma } from "../db/prisma.js";

export const adminRouter = Router();

type BookingForCustomer = Awaited<ReturnType<typeof loadBookingsForCustomers>>[number];

async function loadBookingsForCustomers() {
  return prisma.booking.findMany({
    include: {
      items: true
    },
    orderBy: { createdAt: "desc" }
  });
}

function buildCustomerSummaries(bookings: BookingForCustomer[]) {
  const customers = new Map<
    string,
    {
      name: string;
      phone: string;
      bookingsCount: number;
      totalSpend: number;
      lastBookingAt: string;
      lastService: string;
      city: string;
      status: string;
    }
  >();

  for (const booking of bookings) {
    const existing = customers.get(booking.customerPhone);
    const serviceName = booking.items[0]?.serviceName ?? "Service booking";
    const lastBookingAt = booking.createdAt.toISOString();

    if (!existing) {
      customers.set(booking.customerPhone, {
        name: booking.customerName,
        phone: booking.customerPhone,
        bookingsCount: 1,
        totalSpend: booking.totalAmount,
        lastBookingAt,
        lastService: serviceName,
        city: booking.city,
        status: booking.status
      });
      continue;
    }

    existing.bookingsCount += 1;
    existing.totalSpend += booking.totalAmount;
  }

  return Array.from(customers.values());
}

adminRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayBookings, pendingBookings, activeServices, openLeads, recentBookings, hotLeads, monthBookings, customerBookings] =
      await Promise.all([
        prisma.booking.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.booking.count({ where: { status: { in: ["PENDING", "CONFIRMED", "ASSIGNED"] } } }),
        prisma.service.count({ where: { isActive: true } }),
        prisma.lead.count({ where: { status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } } }),
        prisma.booking.findMany({
          take: 8,
          include: { items: true },
          orderBy: { createdAt: "desc" }
        }),
        prisma.lead.findMany({
          take: 8,
          where: { status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } },
          orderBy: { updatedAt: "desc" }
        }),
        prisma.booking.findMany({
          where: {
            createdAt: { gte: startOfMonth },
            status: { notIn: ["CANCELLED", "REFUNDED"] }
          },
          select: { totalAmount: true }
        }),
        loadBookingsForCustomers()
      ]);

    const customers = buildCustomerSummaries(customerBookings);
    const monthRevenue = monthBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

    return res.json({
      data: {
        metrics: {
          todayBookings,
          pendingBookings,
          monthRevenue,
          activeServices,
          openLeads,
          customers: customers.length
        },
        recentBookings,
        hotLeads,
        customers: customers.slice(0, 8)
      }
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/customers", async (_req, res, next) => {
  try {
    const bookings = await loadBookingsForCustomers();
    return res.json({ data: buildCustomerSummaries(bookings) });
  } catch (error) {
    return next(error);
  }
});
