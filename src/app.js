import cookieParser from "cookie-parser";
import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import AuthRoutes from "./modules/auth/routes/auth.route.js";
import RoleRoutes from "./modules/role/routes/role.route.js";
import UserRoutes from "./modules/user/routes/user.route.js";
import FormRoutes from "./modules/form/routes/form.route.js";
import IdMissionRoutes from "./modules/idMission/routes/idMission.route.js";
import BrandingRoutes from "./modules/branding/routes/branding.route.js";
import cors from "cors";
import { getEnv } from "./configs/config.js";
import { markEmailVerified } from "./modules/idMission/utils/verification.js";
import { addPermissionsIntoDB } from "./configs/permissions.js";
import morgan from "morgan";

const app = express();

// addPermissionsIntoDB();

// middlewares
app.use(
  cors({
    credentials: true,
    origin: [getEnv("FRONTEND_URL"), "https://apply-super-quick.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.get("/", (req, res) => res.status(200).json({ success: true, message: "Hello World!" }));
app.get("/email-verify", async (req, res) => {
  const { token, email, sessionId } = req.query;
  await markEmailVerified(sessionId, email, token);
  console.log(`Redirecting to /verification-success?type=email&sessionId=${sessionId}`);
  // res.redirect(`/verification-success?type=email&sessionId=${sessionId}`);
  return res.status(200).json({ success: true, message: "Email verified successfully" });
});
app.use("/api/auth", AuthRoutes);
app.use("/api/role", RoleRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/form", FormRoutes);
app.use("/api/id-mission", IdMissionRoutes);
app.use("/api/branding", BrandingRoutes);

// error handler
app.use(errorHandler);

export default app;
