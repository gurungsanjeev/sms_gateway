
import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middlewares.js";
import { smsRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.get("/check", authenticateToken, smsRateLimiter, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Request passed the rate limiter.",
  });
});

export default router;
