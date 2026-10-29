
import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {

  const token = req.cookies?.token;
  // console.log("req.cookies.token", req.cookies.token)

  try {
    if (!token) {
      req.user = null
      return res.status(401).json({ message: "Unauthorized" })
    }


// verifying the JWT 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
