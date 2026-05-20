import { googleLoginSchema, otpRequestSchema, otpVerifySchema } from "@the-wings/validation";
import type { User } from "@prisma/client";
import { Router } from "express";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import {
  createJwt,
  createOtp,
  getAuthUserFromRequest,
  hashOtp,
  isSameHash,
  normalizePhone,
  serializeUser
} from "../services/auth.js";
import { sendWhatsAppText } from "../services/whatsapp.js";

export const authRouter = Router();

const otpTtlMinutes = 10;
const maxOtpAttempts = 5;

type GoogleTokenInfo = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
};

function sessionForUser(user: User) {
  return {
    token: createJwt(user),
    user: serializeUser(user)
  };
}

authRouter.get("/me", async (req, res, next) => {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    return res.json({ data: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/otp/request", async (req, res, next) => {
  try {
    const input = otpRequestSchema.parse(req.body);
    const phone = normalizePhone(input.phone);
    const otp = createOtp();
    const expiresAt = new Date(Date.now() + otpTtlMinutes * 60 * 1000);

    await prisma.authOtp.updateMany({
      where: {
        phone,
        consumedAt: null
      },
      data: {
        consumedAt: new Date()
      }
    });

    await prisma.authOtp.create({
      data: {
        phone,
        codeHash: hashOtp(phone, otp),
        expiresAt
      }
    });

    const message = [
      `${otp} is your The Wings Group login OTP.`,
      `It expires in ${otpTtlMinutes} minutes.`,
      "Do not share it with anyone."
    ].join(" ");
    const whatsappResult = await sendWhatsAppText({ phone, message });
    const debugEnabled = env.OTP_DEBUG_ENABLED && env.NODE_ENV !== "production";

    return res.json({
      data: {
        phone,
        expiresInSeconds: otpTtlMinutes * 60,
        delivery: debugEnabled ? "debug" : whatsappResult.sent ? "whatsapp" : "queued",
        debugOtp: debugEnabled ? otp : undefined,
        message: whatsappResult.sent
          ? "OTP sent on WhatsApp."
          : "OTP generated. Configure WhatsApp Cloud API credentials to send it automatically."
      }
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/otp/verify", async (req, res, next) => {
  try {
    const input = otpVerifySchema.parse(req.body);
    const phone = normalizePhone(input.phone);
    const otpRecord = await prisma.authOtp.findFirst({
      where: {
        phone,
        consumedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "OTP expired. Please request a new code." });
    }

    if (otpRecord.attempts >= maxOtpAttempts) {
      return res.status(400).json({ error: "Too many OTP attempts. Please request a new code." });
    }

    const valid = isSameHash(otpRecord.codeHash, hashOtp(phone, input.code));
    if (!valid) {
      await prisma.authOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } }
      });
      return res.status(400).json({ error: "Invalid OTP." });
    }

    const user = await prisma.$transaction(async (tx) => {
      await tx.authOtp.update({
        where: { id: otpRecord.id },
        data: { consumedAt: new Date() }
      });

      return tx.user.upsert({
        where: { phone },
        update: {
          isActive: true,
          name: input.name
        },
        create: {
          role: "CUSTOMER",
          phone,
          name: input.name
        }
      });
    });

    return res.json({ data: sessionForUser(user) });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/google", async (req, res, next) => {
  try {
    if (!env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ error: "Google login is not configured." });
    }

    const input = googleLoginSchema.parse(req.body);
    const tokenResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.credential)}`);
    const tokenInfo = (await tokenResponse.json().catch(() => null)) as GoogleTokenInfo | null;

    if (
      !tokenResponse.ok ||
      !tokenInfo?.sub ||
      tokenInfo.aud !== env.GOOGLE_CLIENT_ID ||
      (tokenInfo.email_verified !== true && tokenInfo.email_verified !== "true")
    ) {
      return res.status(401).json({ error: "Google login could not be verified." });
    }

    const email = tokenInfo.email?.toLowerCase();
    if (!email) {
      return res.status(401).json({ error: "Google account email is required." });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: tokenInfo.sub }, { email }]
      }
    });

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            googleId: existingUser.googleId ?? tokenInfo.sub,
            email,
            name: existingUser.name ?? tokenInfo.name,
            avatarUrl: tokenInfo.picture ?? existingUser.avatarUrl,
            isActive: true
          }
        })
      : await prisma.user.create({
          data: {
            role: "CUSTOMER",
            googleId: tokenInfo.sub,
            email,
            name: tokenInfo.name,
            avatarUrl: tokenInfo.picture,
            isActive: true
          }
        });

    return res.json({ data: sessionForUser(user) });
  } catch (error) {
    return next(error);
  }
});
