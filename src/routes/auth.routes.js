import express from "express";
import { getMyProfile, login, logout, updateMyProfile } from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

app.post("/login", login);
app.get("/logout", isAuthenticated, logout);
app.route("/me").get(isAuthenticated, getMyProfile).put(isAuthenticated, singleUpload, updateMyProfile);

export default app;
