
import { Router } from "express";
import { getRoutesHealth } from "../controllers/route.controller.js";

const router = Router();

router.get("/health", getRoutesHealth);

export default router;
