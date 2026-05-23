import { Router, type NextFunction, type Response } from "express";
import { Prisma } from "@prisma/client";
import { leadCreateSchema, leadUpdateSchema } from "@the-wings/validation";
import { prisma } from "../db/prisma.js";
import { requireRoles } from "../middleware/auth.js";

export const leadsRouter = Router();
leadsRouter.use(...requireRoles("ADMIN", "MANAGER"));

leadsRouter.get("/", async (_req, res, next) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });
    res.json({ data: leads });
  } catch (error) {
    next(error);
  }
});

leadsRouter.post("/", async (req, res, next) => {
  try {
    const input = leadCreateSchema.parse(req.body);
    const existingLead = await prisma.lead.findFirst({
      where: { phone: input.phone },
      orderBy: { updatedAt: "desc" }
    });

    if (existingLead) {
      const lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          ...input,
          source: input.source ?? existingLead.source,
          notes: mergeLeadNotes(existingLead.notes, input.notes)
        }
      });
      return res.json({ data: lead });
    }

    const lead = await prisma.lead.create({ data: input });
    return res.status(201).json({ data: lead });
  } catch (error) {
    return handleLeadWriteError(error, res, next);
  }
});

leadsRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = leadUpdateSchema.parse(req.body);
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: input
    });
    res.json({ data: lead });
  } catch (error) {
    return handleLeadWriteError(error, res, next);
  }
});

leadsRouter.delete("/:id", async (req, res, next) => {
  try {
    const lead = await prisma.lead.delete({
      where: { id: req.params.id }
    });
    res.json({ data: lead });
  } catch (error) {
    return handleLeadWriteError(error, res, next);
  }
});

function mergeLeadNotes(existing?: string | null, incoming?: string | null) {
  if (!incoming) return existing;
  if (!existing) return incoming;
  if (existing.includes(incoming)) return existing;
  return `${existing}\n\n${incoming}`;
}

function handleLeadWriteError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return res.status(404).json({ error: "Lead was not found." });
  }

  return next(error);
}
