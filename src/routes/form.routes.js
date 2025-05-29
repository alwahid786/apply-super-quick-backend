import express from "express";

import { webPermissions } from "../configs/permissions.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { createNewForm } from "../controllers/form.controller.js";
import { singleUpload } from "../middlewares/multer.js";
const { create_form } = webPermissions;

const app = express.Router();

app.post("/create", isAuthenticated, isAuthorized(create_form), singleUpload, createNewForm);

export default app;
