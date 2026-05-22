import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireRoles } from "../middleware/auth.js";
import { logger } from "../services/logger.js";

export const adminRouter = Router();
adminRouter.use(...requireRoles("ADMIN", "MANAGER"));

type BookingForCustomer = Awaited<ReturnType<typeof loadBookingsForCustomers>>[number];
type AdminEventSnapshot = Awaited<ReturnType<typeof loadAdminEventSnapshot>>;

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

adminRouter.get("/events", async (req, res, next) => {
  let initialSnapshot: AdminEventSnapshot;

  try {
    initialSnapshot = await loadAdminEventSnapshot();
  } catch (error) {
    return next(error);
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  let closed = false;
  let previousRevision = initialSnapshot.revision;

  function send(event: string, data: AdminEventSnapshot | { ok: true; timestamp: string }) {
    if (closed) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  async function publish() {
    const snapshot = await loadAdminEventSnapshot();
    if (snapshot.revision !== previousRevision) {
      previousRevision = snapshot.revision;
      send("admin:update", snapshot);
      return;
    }

    send("heartbeat", { ok: true, timestamp: new Date().toISOString() });
  }

  send("connected", initialSnapshot);

  const interval = setInterval(() => {
    publish().catch((error: unknown) => {
      send("admin:error", { ok: true, timestamp: new Date().toISOString() });
      logger.error("Admin event stream failed", { error });
    });
  }, 10000);

  req.on("close", () => {
    closed = true;
    clearInterval(interval);
    res.end();
  });
});

async function loadAdminEventSnapshot() {
  const [bookingCount, latestBooking, pendingBookings, activeServices, leadCount, latestLead, latestService] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        bookingCode: true,
        customerName: true,
        status: true,
        totalAmount: true,
        updatedAt: true
      }
    }),
    prisma.booking.count({ where: { status: { in: ["PENDING", "CONFIRMED", "ASSIGNED"] } } }),
    prisma.service.count({ where: { isActive: true } }),
    prisma.lead.count({ where: { status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } } }),
    prisma.lead.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        updatedAt: true
      }
    }),
    prisma.service.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true
      }
    })
  ]);

  const revision = [
    bookingCount,
    pendingBookings,
    activeServices,
    leadCount,
    latestBooking?.bookingCode ?? "no-booking",
    latestBooking?.updatedAt.toISOString() ?? "no-booking-time",
    latestLead?.id ?? "no-lead",
    latestLead?.updatedAt.toISOString() ?? "no-lead-time",
    latestService?.id ?? "no-service",
    latestService?.updatedAt.toISOString() ?? "no-service-time"
  ].join(":");

  return {
    revision,
    timestamp: new Date().toISOString(),
    metrics: {
      bookingCount,
      pendingBookings,
      activeServices,
      openLeads: leadCount
    },
    latest: {
      booking: latestBooking
        ? {
            bookingCode: latestBooking.bookingCode,
            customerName: latestBooking.customerName,
            status: latestBooking.status,
            totalAmount: latestBooking.totalAmount,
            updatedAt: latestBooking.updatedAt.toISOString()
          }
        : null,
      lead: latestLead
        ? {
            id: latestLead.id,
            name: latestLead.name,
            phone: latestLead.phone,
            status: latestLead.status,
            updatedAt: latestLead.updatedAt.toISOString()
          }
        : null,
      service: latestService
        ? {
            id: latestService.id,
            name: latestService.name,
            isActive: latestService.isActive,
            updatedAt: latestService.updatedAt.toISOString()
          }
        : null
    }
  };
}
