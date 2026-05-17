import cors from "cors";
import express from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { corsOrigins, env } from "./config/env.js";
import { adminRouter } from "./routes/admin.js";
import { bookingsRouter } from "./routes/bookings.js";
import { crmRouter } from "./routes/crm.js";
import { healthRouter } from "./routes/health.js";
import { leadsRouter } from "./routes/leads.js";
import { servicesRouter } from "./routes/services.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);
app.use("/admin", adminRouter);
app.use("/services", servicesRouter);
app.use("/bookings", bookingsRouter);
app.use("/leads", leadsRouter);
app.use("/crm", crmRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.flatten()
    });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(env.PORT, () => {
  console.log(`The Wings API is running on http://localhost:${env.PORT}`);
});
