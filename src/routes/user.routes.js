import express from "express";
import {
  createUser,
  getAllUsers,
  getSingleUser,
  updateSingleUser,
  deleteSingleUser,
} from "../controllers/user.controller.js";
import { webPermissions } from "../configs/permissions.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
const app = express.Router();
const { create_user, read_user, update_user, delete_user } = webPermissions;

app.post("/create", isAuthenticated, isAuthorized(create_user), createUser);
app.get("/all", isAuthenticated, isAuthorized(read_user), getAllUsers);
app
  .route("/single/:userId")
  .get(isAuthenticated, isAuthorized(read_user), getSingleUser)
  .put(isAuthenticated, isAuthorized(update_user), updateSingleUser)
  .delete(isAuthenticated, isAuthorized(delete_user), deleteSingleUser);

export default app;
