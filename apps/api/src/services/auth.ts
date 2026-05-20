import type { User } from "@prisma/client";
import crypto from "node:crypto";
import type { Request } from "express";
import type { AuthUser } from "@the-wings/types";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";

type JwtPayload = {
  sub: string;
  role: User["role"];
  iat: number;
  exp: number;
};

const sessionTtlSeconds = 60 * 60 * 24 * 30;

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  return crypto.createHmac("sha256", env.JWT_SECRET).update(value).digest("base64url");
}

function parseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

export function createOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashOtp(phone: string, otp: string) {
  return crypto.createHmac("sha256", env.JWT_SECRET).update(`${normalizePhone(phone)}:${otp}`).digest("hex");
}

export function isSameHash(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function serializeUser(user: User): AuthUser {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    googleId: user.googleId,
    avatarUrl: user.avatarUrl
  };
}

export function createJwt(user: User) {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
    iat: now,
    exp: now + sessionTtlSeconds
  };
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.${sign(`${header}.${body}`)}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  if (!header || !body || !signature || !isSameHash(signature, sign(`${header}.${body}`))) {
    return null;
  }

  const payload = parseJson<JwtPayload>(Buffer.from(body, "base64url").toString("utf8"));
  if (!payload || !payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export async function getAuthUserFromRequest(req: Request) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token) return null;

  const payload = verifyJwt(token);
  if (!payload) return null;

  const user = await prisma.user.findFirst({
    where: {
      id: payload.sub,
      isActive: true
    }
  });

  return user;
}
