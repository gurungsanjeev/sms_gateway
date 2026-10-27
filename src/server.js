
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import prisma from "./config/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import smsRoutes from '../src/routes/sms.routes.js'


dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

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
app.use('/api/sms', smsRoutes)


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
