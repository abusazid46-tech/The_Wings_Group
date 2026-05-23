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
  const name = normalizeText(input.name) ?? "";
  const slug = normalizeText(input.slug) || slugify(name);
  const description = normalizeText(input.description) ?? "";
  const normalized: Record<string, unknown> = { ...input };

  if (input.categoryId !== undefined || options.defaultDescription) normalized.categoryId = normalizeText(input.categoryId) || "cleaning";
  if (input.name !== undefined || options.defaultDescription) normalized.name = name;
  if (input.slug !== undefined || options.defaultDescription) normalized.slug = slug;
  if (input.icon !== undefined) normalized.icon = normalizeText(input.icon);
  if (input.imageUrl !== undefined) normalized.imageUrl = normalizeText(input.imageUrl);
  if (input.basePrice !== undefined) normalized.basePrice = normalizeInteger(input.basePrice);
  if (input.durationMin !== undefined) normalized.durationMin = normalizeInteger(input.durationMin);
  if (input.sortOrder !== undefined) normalized.sortOrder = normalizeInteger(input.sortOrder);
  if (input.isActive !== undefined) normalized.isActive = normalizeBoolean(input.isActive);

  if (input.description !== undefined || options.defaultDescription) {
    return {
      ...normalized,
      description: description.length >= 10 ? description : name ? `${name} service by The Wings Group.` : description
    };
  }

  return normalized;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function normalizeInteger(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;
  if (typeof value !== "string") return value;

  const numericText = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0];
  return numericText ? Number(numericText) : undefined;
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return value;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
