import { Router } from "express";
import { serviceCreateSchema, serviceUpdateSchema } from "@the-wings/validation";
import { prisma } from "../db/prisma.js";
import { isStaffRole, optionalAuth, requireRoles } from "../middleware/auth.js";

export const servicesRouter = Router();

const defaultCategories = [
  { name: "Cleaning", slug: "cleaning", description: "Home, bathroom, sofa, kitchen, and deep cleaning services.", sortOrder: 1 },
  { name: "AC & Appliance", slug: "ac-appliance", description: "AC servicing, appliance cleaning, and home electrical support.", sortOrder: 2 },
  { name: "Security", slug: "security", description: "Security and facility management services.", sortOrder: 3 }
];

async function ensureDefaultCategories() {
  const count = await prisma.serviceCategory.count();
  if (count > 0) return;

  await prisma.serviceCategory.createMany({
    data: defaultCategories,
    skipDuplicates: true
  });
}

servicesRouter.get("/categories", async (_req, res, next) => {
  try {
    await ensureDefaultCategories();
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { sortOrder: "asc" }
    });
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
});

servicesRouter.get("/", optionalAuth, async (req, res, next) => {
  try {
    const user = (req as typeof req & { authUser?: { role: "ADMIN" | "MANAGER" | "STAFF" | "CUSTOMER" } }).authUser;
    const canSeeInactive = Boolean(user && isStaffRole(user.role));
    if (req.query.includeInactive === "true" && !canSeeInactive) {
      return res.status(403).json({ error: "You do not have permission to view inactive services" });
    }

    const services = await prisma.service.findMany({
      where: req.query.includeInactive === "true" && canSeeInactive ? undefined : { isActive: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }]
    });
    res.json({ data: services });
  } catch (error) {
    next(error);
  }
});

servicesRouter.post("/", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const input = serviceCreateSchema.parse(req.body);
    const service = await prisma.service.create({ data: input });
    res.status(201).json({ data: service });
  } catch (error) {
    next(error);
  }
});

servicesRouter.patch("/:id", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const input = serviceUpdateSchema.parse(req.body);
    const service = await prisma.service.update({
      where: { id: String(req.params.id ?? "") },
      data: input
    });
    res.json({ data: service });
  } catch (error) {
    next(error);
  }
});

servicesRouter.delete("/:id", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const service = await prisma.service.update({
      where: { id: String(req.params.id ?? "") },
      data: { isActive: false }
    });
    res.json({ data: service });
  } catch (error) {
    next(error);
  }
});
