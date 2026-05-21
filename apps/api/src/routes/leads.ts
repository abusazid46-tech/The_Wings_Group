import { Router } from "express";
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
    const lead = await prisma.lead.create({ data: input });
    res.status(201).json({ data: lead });
  } catch (error) {
    next(error);
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
    next(error);
  }
});

leadsRouter.delete("/:id", async (req, res, next) => {
  try {
    const lead = await prisma.lead.delete({
      where: { id: req.params.id }
    });
    res.json({ data: lead });
  } catch (error) {
    next(error);
  }
});
