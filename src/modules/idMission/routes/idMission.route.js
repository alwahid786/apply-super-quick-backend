import express from "express";
import { isAuthenticated } from "../../../middlewares/authMiddleware.js";
import { createIDmissionSession, getProceedData, idMissionWebhook } from "../controllers/idMission.controller.js";

const app = express.Router();

app.get("/get-session", isAuthenticated, createIDmissionSession);
app.post("/webhook", idMissionWebhook);
app.get("/get-data", getProceedData);

export default app;
