
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import prisma from "./config/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import smsRoutes from "./routes/sms.routes.js";
import routeRoutes from "./routes/route.routes.js";
import rateLimitTestRoutes from "./routes/rate-limit-test.routes.js";
import cookieParser from "cookie-parser";




dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "SMS Gateway API is running",
  });
});

app.get("/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "OK",
      message: "PostgreSQL connection successful",
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
    });
  }
});


app.use("/api/auth", authRoutes);
app.use('/api/sms', smsRoutes);
app.use("/routes", routeRoutes);

app.use("/api/test-rate-limit", rateLimitTestRoutes);



const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
   