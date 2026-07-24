import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

export const verifyToken = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ message: "Unauthorized access" });
    }
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      role: session.user.role || "user",
      status: session.user.status || "active",
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
};

export const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
