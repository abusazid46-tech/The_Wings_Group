import { Router } from "express";
import { serviceCreateSchema } from "@the-wings/validation";
import { prisma } from "../db/prisma.js";

export const servicesRouter = Router();

servicesRouter.get("/", async (_req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }]
    });
    res.json({ data: services });
  } catch (error) {
    next(error);
  }
});

servicesRouter.post("/", async (req, res, next) => {
  try {
    const input = serviceCreateSchema.parse(req.body);
    const service = await prisma.service.create({ data: input });
    res.status(201).json({ data: service });
  } catch (error) {
    next(error);
  }
});
