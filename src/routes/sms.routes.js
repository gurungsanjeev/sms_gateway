
import { Router } from "express";
import { getSmsLogs, sendSms } from "../controllers/sms.controller.js";
import { authenticateToken } from "../middlewares/auth.middlewares.js";
import { smsRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/send", authenticateToken, smsRateLimiter, sendSms);
router.get("/logs", authenticateToken, getSmsLogs);

export default router;
