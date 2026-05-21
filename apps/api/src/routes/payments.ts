import crypto from "node:crypto";
import { Router } from "express";
import { razorpayOrderCreateSchema, razorpayVerifySchema } from "@the-wings/validation";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { canAccessUserResource, requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

export const paymentsRouter = Router();

function isRazorpayConfigured() {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

function createMockOrderId() {
  return `order_local_${Date.now().toString(36)}`;
}

function createRazorpayAuthHeader() {
  return `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`;
}

paymentsRouter.post("/razorpay/order", rateLimit({ keyPrefix: "payment-order", windowMs: 15 * 60 * 1000, max: 20 }), requireAuth, async (req, res, next) => {
  try {
    const input = razorpayOrderCreateSchema.parse(req.body);
    const booking = await prisma.booking.findUnique({
      where: { bookingCode: input.bookingCode },
      include: { payments: true }
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!canAccessUserResource(req, booking.userId)) {
      return res.status(403).json({ error: "You do not have permission to pay for this booking" });
    }

    if (booking.totalAmount <= 0) {
      return res.status(400).json({ error: "Booking total must be greater than zero for online payment" });
    }

    const existingPaidPayment = booking.payments.find((payment) => payment.provider === "RAZORPAY" && payment.status === "PAID");
    if (existingPaidPayment) {
      return res.status(409).json({ error: "Booking is already paid" });
    }

    if (!isRazorpayConfigured()) {
      const localOrderId = createMockOrderId();
      const payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          provider: "RAZORPAY",
          providerOrderId: localOrderId,
          amount: booking.totalAmount,
          currency: "INR",
          status: "PENDING",
          rawPayload: {
            mode: "local",
            reason: "Razorpay credentials missing"
          }
        }
      });

      return res.json({
        data: {
          bookingCode: booking.bookingCode,
          paymentId: payment.id,
          provider: "RAZORPAY",
          orderId: localOrderId,
          amount: booking.totalAmount * 100,
          currency: "INR",
          checkoutEnabled: false,
          message: "Razorpay credentials are not configured yet."
        }
      });
    }

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: createRazorpayAuthHeader(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: booking.totalAmount * 100,
        currency: "INR",
        receipt: booking.bookingCode,
        notes: {
          bookingCode: booking.bookingCode,
          customerPhone: booking.customerPhone
        }
      })
    });

    const razorpayOrder = (await razorpayResponse.json().catch(() => null)) as
      | { id?: string; amount?: number; currency?: string; error?: { description?: string } }
      | null;

    if (!razorpayResponse.ok || !razorpayOrder?.id) {
      return res.status(502).json({ error: razorpayOrder?.error?.description ?? "Razorpay order creation failed" });
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: "RAZORPAY",
        providerOrderId: razorpayOrder.id,
        amount: booking.totalAmount,
        currency: razorpayOrder.currency ?? "INR",
        status: "PENDING",
        rawPayload: razorpayOrder
      }
    });

    return res.json({
      data: {
        bookingCode: booking.bookingCode,
        paymentId: payment.id,
        provider: "RAZORPAY",
        keyId: env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount ?? booking.totalAmount * 100,
        currency: razorpayOrder.currency ?? "INR",
        checkoutEnabled: true,
        message: "Razorpay order created."
      }
    });
  } catch (error) {
    return next(error);
  }
});

paymentsRouter.post("/razorpay/verify", rateLimit({ keyPrefix: "payment-verify", windowMs: 15 * 60 * 1000, max: 30 }), requireAuth, async (req, res, next) => {
  try {
    const input = razorpayVerifySchema.parse(req.body);

    if (!env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ error: "Razorpay key secret is not configured" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== input.razorpaySignature) {
      return res.status(400).json({ error: "Invalid Razorpay signature" });
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingCode: input.bookingCode }
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!canAccessUserResource(req, booking.userId)) {
      return res.status(403).json({ error: "You do not have permission to verify this payment" });
    }

    const payment = await prisma.payment.updateMany({
      where: {
        bookingId: booking.id,
        provider: "RAZORPAY",
        providerOrderId: input.razorpayOrderId
      },
      data: {
        providerPaymentId: input.razorpayPaymentId,
        status: "PAID",
        rawPayload: {
          razorpayOrderId: input.razorpayOrderId,
          razorpayPaymentId: input.razorpayPaymentId,
          razorpaySignature: input.razorpaySignature
        }
      }
    });

    if (payment.count === 0) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    const paidPayment = await prisma.payment.findFirstOrThrow({
      where: {
        bookingId: booking.id,
        provider: "RAZORPAY",
        providerOrderId: input.razorpayOrderId
      }
    });

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentMode: "RAZORPAY",
        status: booking.status === "PENDING" ? "CONFIRMED" : booking.status,
        statusLogs: {
          create: {
            status: booking.status === "PENDING" ? "CONFIRMED" : booking.status,
            note: "Razorpay payment verified"
          }
        }
      },
      include: {
        items: true,
        payments: true
      }
    });

    return res.json({
      data: {
        booking: updatedBooking,
        payment: paidPayment
      }
    });
  } catch (error) {
    return next(error);
  }
});
