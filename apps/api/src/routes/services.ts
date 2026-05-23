import { Router, type NextFunction, type Response } from "express";
import { Prisma } from "@prisma/client";
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
    const input = await parseServiceCreateBody(req.body);
    const service = await prisma.service.create({ data: input });
    res.status(201).json({ data: service });
  } catch (error) {
    handleServiceWriteError(error, res, next);
  }
});

servicesRouter.patch("/:id", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const input = await parseServiceUpdateBody(req.body);
    const service = await prisma.service.update({
      where: { id: String(req.params.id ?? "") },
      data: input
    });
    res.json({ data: service });
  } catch (error) {
    handleServiceWriteError(error, res, next);
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
    handleServiceWriteError(error, res, next);
  }
});

function handleServiceWriteError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "A service with this slug already exists. Use a unique slug." });
    }

    if (error.code === "P2003") {
      return res.status(400).json({ error: "Choose a valid service category before saving." });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Service was not found." });
    }
  }

  return next(error);
}

async function parseServiceCreateBody(body: unknown) {
  await ensureDefaultCategories();
  const input = serviceCreateSchema.parse(normalizeServiceBody(body, { defaultDescription: true }));
  const categoryId = await resolveServiceCategoryId(input.categoryId);
  const nextSortOrder = input.sortOrder > 0 ? input.sortOrder : (await prisma.service.count()) + 1;

  return {
    ...input,
    categoryId,
    sortOrder: nextSortOrder
  };
}

async function parseServiceUpdateBody(body: unknown) {
  await ensureDefaultCategories();
  const input = serviceUpdateSchema.parse(normalizeServiceBody(body, { defaultDescription: false }));
  if (!input.categoryId) return input;

  return {
    ...input,
    categoryId: await resolveServiceCategoryId(input.categoryId)
  };
}

function normalizeServiceBody(body: unknown, options: { defaultDescription: boolean }) {
  if (!body || typeof body !== "object") return body;
  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const normalized = {
    ...input,
    name: typeof input.name === "string" ? input.name.trim() : input.name,
    slug: typeof input.slug === "string" ? input.slug.trim() : input.slug,
    icon: typeof input.icon === "string" ? input.icon.trim() || undefined : input.icon,
    imageUrl: typeof input.imageUrl === "string" ? input.imageUrl.trim() || undefined : input.imageUrl
  };

  if (typeof input.description === "string" || options.defaultDescription) {
    return {
      ...normalized,
      description: description.length >= 10 ? description : name ? `${name} service by The Wings Group.` : description
    };
  }

  return normalized;
}

async function resolveServiceCategoryId(categoryId: string) {
  const category = await prisma.serviceCategory.findFirst({
    where: {
      OR: [{ id: categoryId }, { slug: categoryId }]
    }
  });
  if (category) return category.id;

  const fallbackCategory = await prisma.serviceCategory.findFirst({
    orderBy: { sortOrder: "asc" }
  });
  if (fallbackCategory) return fallbackCategory.id;

  throw new Error("No service categories are available.");
}
