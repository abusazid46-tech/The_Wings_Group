import { Router } from "express";
import { crmNoteCreateSchema, whatsappMessageCreateSchema } from "@the-wings/validation";
import { prisma } from "../db/prisma.js";

export const crmRouter = Router();

crmRouter.get("/notes", async (_req, res, next) => {
  try {
    const notes = await prisma.crmNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });
    res.json({ data: notes });
  } catch (error) {
    next(error);
  }
});

crmRouter.post("/notes", async (req, res, next) => {
  try {
    const input = crmNoteCreateSchema.parse(req.body);
    const note = await prisma.crmNote.create({ data: input });
    res.status(201).json({ data: note });
  } catch (error) {
    next(error);
  }
});

crmRouter.get("/whatsapp", async (_req, res, next) => {
  try {
    const messages = await prisma.whatsappMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });
    res.json({ data: messages });
  } catch (error) {
    next(error);
  }
});

crmRouter.post("/whatsapp", async (req, res, next) => {
  try {
    const input = whatsappMessageCreateSchema.parse(req.body);
    const message = await prisma.whatsappMessage.create({
      data: {
        phone: input.phone,
        template: input.template,
        direction: input.direction,
        status: input.status,
        payload: {
          message: input.message
        }
      }
    });
    const whatsappUrl = `https://wa.me/91${input.phone}?text=${encodeURIComponent(input.message)}`;
    res.status(201).json({ data: message, whatsappUrl });
  } catch (error) {
    next(error);
  }
});
