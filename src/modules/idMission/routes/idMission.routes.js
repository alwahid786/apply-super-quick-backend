import express from "express";


import { webPermissions } from "../../../configs/permissions.js";
import { isAuthenticated, isAuthorized } from "../../../middlewares/authMiddleware.js";

const { create_role, read_role, update_role, delete_role } = webPermissions;

const app = express.Router();

app.post("/create", isAuthenticated, isAuthorized(create_role), createRole);


export default app;
