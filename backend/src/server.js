import { ENV } from "./config/env.js";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";
import notificationRoutes from "./routes/notification.route.js";

import { connectDB } from "./config/db.js";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";

const app = express();

// Allowed origins list. Always includes the Expo web dev server.
// Add more via CORS_ORIGIN env var (comma-separated) for production domains.
const ALLOWED_ORIGINS = new Set([
  "http://localhost:8081",   // Expo web (browser)
  "http://localhost:19006",  // Expo web (older SDK fallback)
  "http://localhost:3000",   // common React dev server
  ...(ENV.CORS_ORIGIN
    ? ENV.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
    : []),
]);

const corsOptions = {
  // Reflect the request Origin back when it is in the allow-list, or allow
  // any non-browser client (React Native / Expo Go on device / Postman).
  // Browsers always send an Origin header; non-browser clients often don't.
  origin: (origin, callback) => {
    // No origin = same-origin request or non-browser client → allow
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.has(origin)) return callback(null, origin);
    // Also allow any exp:// or http:// Expo Go deep-link origins from LAN IPs
    if (/^exp:\/\//.test(origin) || /^http:\/\/192\.168\./.test(origin) || /^http:\/\/10\./.test(origin)) {
      return callback(null, origin);
    }
    callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" })); // increased for base64 image uploads

app.use(clerkMiddleware());
app.use(arcjetMiddleware);

app.get("/", (req, res) => res.send("Hello from server"));

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);

// error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  if (err.name === "CastError") {
    return res.status(400).json({ error: `Invalid ${err.path || "ID"}` });
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(", ") });
  }

  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const startServer = async () => {
  try {
    await connectDB();

    // listen for local development
    if (ENV.NODE_ENV !== "production") {
      app.listen(ENV.PORT, () => console.log("Server is up and running on PORT:", ENV.PORT));
    }
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

// export for vercel - v2
export default app;