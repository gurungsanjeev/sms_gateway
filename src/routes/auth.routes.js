
import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middlewares.js"

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticateToken, (req, res) => {
    return res.status(200).json({
        message: "Authentication successful",
        user: req.user,
    });
});

export default router;
