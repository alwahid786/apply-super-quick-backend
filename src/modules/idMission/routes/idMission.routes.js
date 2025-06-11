import { webPermissions } from "../../../configs/permissions.js";
import express from "express";
import { isAuthenticated, isAuthorized } from "../../../middlewares/authMiddleware.js";
import { createIdMissionSession, verifyEmail, verifyPhone } from "../controllers/idMission.controller.js";

const { create_role, read_role, update_role, delete_role } = webPermissions;

const app = express.Router();

app.post("/create", isAuthenticated, isAuthorized(create_role), createIdMissionSession);
app.get("/email-verify", isAuthenticated, verifyEmail);
app.get("/phone-verify", isAuthenticated, verifyPhone);

export default app;
