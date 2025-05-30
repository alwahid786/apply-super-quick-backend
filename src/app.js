import cookieParser from "cookie-parser";
import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import AuthRoutes from "./modules/auth/routes/auth.routes.js";
import RoleRoutes from "./modules/role/routes/role.routes.js";
import UserRoutes from "./modules/user/routes/user.routes.js";
import FormRoutes from "./modules/form/routes/form.routes.js";
import cors from "cors";
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
app.use("/api/form", FormRoutes);

// error handler
app.use(errorHandler);

export default app;
