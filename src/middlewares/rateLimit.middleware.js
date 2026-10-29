
import rateLimit from "express-rate-limit";

export const smsRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 60, // Maximum 60 requests per window
    standardHeaders: "draft-8",
    legacyHeaders: false,

    // Each authenticated user gets a separate limit.
    keyGenerator: (req) => `user:${req.user.userId}`,

    message: {
        success: false,
        message: "Too many SMS requests. Please try again in a minute.",
    },
});
