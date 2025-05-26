import cookieParser from "cookie-parser";
import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import AuthRoutes from "./routes/auth.routes.js";
import RoleRoutes from "./routes/role.routes.js";
import UserRoutes from "./routes/user.routes.js";
import cors from "cors";
import { addPermissionsIntoDB } from "./configs/permissions.js";
import { getEnv } from "./configs/config.js";

const app = express();

// addPermissionsIntoDB();

// middlewares
app.use(
  cors({
    credentials: true,
    origin: [...getEnv("CORS_URLS")],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.get("/", (req, res) => res.status(200).json({ success: true, message: "Hello World!" }));
app.use("/api/auth", AuthRoutes);
app.use("/api/role", RoleRoutes);
app.use("/api/user", UserRoutes);

// error handler
app.use(errorHandler);

export default app;
