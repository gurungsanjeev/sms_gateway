
import { Router } from "express";
import { sendSms } from "../controllers/sms.controller.js";
import { authenticateToken } from "../middlewares/auth.middlewares.js";

const router = Router();

router.post("/send", authenticateToken, sendSms);

export default router;
