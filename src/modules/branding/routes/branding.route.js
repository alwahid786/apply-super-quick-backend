import express from "express";
import { webPermissions } from "../../../configs/permissions.js";
import { isAuthenticated, isAuthorized } from "../../../middlewares/authMiddleware.js";
import {
  extractThemeFromUrl,
  createBranding,
  getSingleBranding,
  updateSingleBranding,
  deleteSingleBranding,
  getAllBrandings,
  addBrandingInForm,
} from "../controllers/branding.controller.js";
import { multipleUpload } from "../../../middlewares/multer.js";

const router = express.Router();
const { create_branding, read_branding, update_branding, delete_branding } = webPermissions;

router.post("/extract", isAuthenticated, isAuthorized(read_branding), extractThemeFromUrl);

router.post("/create", isAuthenticated, isAuthorized(create_branding), multipleUpload, createBranding);

router
  .route("/single/:brandingId")
  .get(isAuthenticated, isAuthorized(read_branding), getSingleBranding)
  .put(isAuthenticated, isAuthorized(update_branding), multipleUpload, updateSingleBranding)
  .delete(isAuthenticated, isAuthorized(delete_branding), deleteSingleBranding);

router.put("/apply/branding", isAuthenticated, isAuthorized(update_branding), addBrandingInForm);

router.get("/all", isAuthenticated, isAuthorized(read_branding), getAllBrandings);

export default router;
