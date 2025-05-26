import express from "express";
import {
  createRole,
  deleteSingleRole,
  getAllRoles,
  getSingleRole,
  updateSingleRole,
} from "../controllers/role.controller.js";
import { webPermissions } from "../configs/permissions.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const { create_role, read_role, update_role, delete_role } = webPermissions;

const app = express.Router();

app.post("/create", isAuthenticated, isAuthorized(create_role), createRole);
app.get("/all", isAuthenticated, isAuthorized(read_role), getAllRoles);
app
  .route("/single/:roleId")
  .get(isAuthenticated, isAuthorized(read_role), getSingleRole)
  .put(isAuthenticated, isAuthorized(update_role), updateSingleRole)
  .delete(isAuthenticated, isAuthorized(delete_role), deleteSingleRole);

export default app;
