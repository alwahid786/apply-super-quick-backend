import express from "express";
import { webPermissions } from "../../../configs/permissions.js";
import { isAuthenticated, isAuthorized } from "../../../middlewares/authMiddleware.js";
import {
  createBranding,
  deleteSingleBranding,
  extractThemeFromUrl,
  getAllBrandings,
  getSingleBranding,
  updateSingleBranding,
} from "../controllers/branding.controller.js";

const app = express.Router();

const { create_branding, read_branding, update_branding, delete_branding } = webPermissions;

app.get("/extract", isAuthenticated, isAuthorized(read_branding), extractThemeFromUrl);

app.post("/create", isAuthenticated, isAuthorized(create_branding), createBranding);
app
  .route("/single/:brandingId")
  .get(isAuthenticated, isAuthorized(read_branding), getSingleBranding)
  .put(isAuthenticated, isAuthorized(update_branding), updateSingleBranding)
  .delete(isAuthenticated, isAuthorized(delete_branding), deleteSingleBranding);

app.get("/all", isAuthenticated, isAuthorized(read_branding), getAllBrandings);

export default app;
