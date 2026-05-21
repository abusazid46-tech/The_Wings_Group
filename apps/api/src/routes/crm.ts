import { Router } from "express";
import { crmNoteCreateSchema, whatsappMessageCreateSchema } from "@the-wings/validation";
import { prisma } from "../db/prisma.js";
import { requireRoles } from "../middleware/auth.js";
import { sendWhatsAppText } from "../services/whatsapp.js";

export const crmRouter = Router();
crmRouter.use(...requireRoles("ADMIN", "MANAGER"));

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
    const result = await sendWhatsAppText({ phone: input.phone, message: input.message });
    const message = await prisma.whatsappMessage.create({
      data: {
        phone: input.phone,
        template: input.template,
        direction: input.direction,
        status: result.status === "QUEUED" ? input.status : result.status,
        payload: {
          message: input.message,
          providerMessageId: result.providerMessageId,
          providerResponse: result.providerResponse ? JSON.parse(JSON.stringify(result.providerResponse)) : null,
          providerMessage: result.message
        }
      }
    });
    res.status(201).json({
      data: message,
      whatsappUrl: result.whatsappUrl,
      sent: result.sent,
      providerMessageId: result.providerMessageId,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});
