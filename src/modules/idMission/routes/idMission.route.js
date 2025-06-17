import { webPermissions } from "../../../configs/permissions.js";
import express from "express";
import { isAuthenticated, isAuthorized } from "../../../middlewares/authMiddleware.js";
import { createIdMissionSession, verifyEmail, verifyPhone } from "../controllers/idMission.controller.js";

const app = express.Router();

app.post("/create", isAuthenticated, createIdMissionSession);
app.get("/email-verify", isAuthenticated, verifyEmail);
app.get("/phone-verify", isAuthenticated, verifyPhone);

export default app;
