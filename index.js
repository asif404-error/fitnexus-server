import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import connectDB from "./config/db.js";
import { auth } from "./auth.js";

import userRoutes from "./routes/users.js";
import classRoutes from "./routes/classes.js";
import bookingRoutes from "./routes/bookings.js";
import favoriteRoutes from "./routes/favorites.js";
import forumPostRoutes from "./routes/forumPosts.js";
import commentRoutes from "./routes/comments.js";
import paymentRoutes from "./routes/payments.js";

const app = express();

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.get("/api/me", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ user: null });
    }

    const { default: User } = await import("./models/user.js");
    let dbUser = null;
    try {
      dbUser = await User.findById(session.user.id);
    } catch (e) {}

    res.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: dbUser?.image || session.user.image || "",
        role: dbUser?.role || "user",
        status: dbUser?.status || "active",
        trainerApplicationStatus: dbUser?.trainerApplicationStatus || "none",
        trainerExperience: dbUser?.trainerExperience,
        trainerSpecialty: dbUser?.trainerSpecialty,
        trainerFeedback: dbUser?.trainerFeedback,
      },
    });
  } catch (error) {
    res.status(401).json({ user: null });
  }
});

app.post("/api/custom-logout", (req, res) => {
  res.clearCookie("better-auth.session_token");
  res.clearCookie("better-auth.session_token.0");
  res.clearCookie("better-auth.session_token.1");
  res.json({ message: "Logged out" });
});

app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/forum-posts", forumPostRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => res.send("FitNexus API is running"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`FitNexus server running on port ${PORT}`));
