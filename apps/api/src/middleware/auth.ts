import type { User, UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { getAuthUserFromRequest } from "../services/auth.js";

export type AuthedRequest = Request & {
  authUser: User;
};

const staffRoles: UserRole[] = ["ADMIN", "MANAGER", "STAFF"];

export function isStaffRole(role: UserRole) {
  return staffRoles.includes(role);
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (user) {
      (req as Request & { authUser?: User }).authUser = user;
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    (req as AuthedRequest).authUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireRoles(...roles: UserRole[]) {
  return [requireAuth, (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthedRequest).authUser;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "You do not have permission to access this resource" });
    }

    return next();
  }];
}

export function canAccessUserResource(req: Request, userId?: string | null) {
  const user = (req as Request & { authUser?: User }).authUser;
  if (!user) return false;
  if (isStaffRole(user.role)) return true;
  return Boolean(userId && user.id === userId);
}
