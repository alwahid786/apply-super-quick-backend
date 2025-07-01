import express from "express";
import { webPermissions } from "../../../configs/permissions.js";
import { isAuthenticated, isAuthorized } from "../../../middlewares/authMiddleware.js";
import { createNewForm, deleteSingleForm, getMyallForms, getSingleForm } from "../controllers/form.controller.js";
import { singleUpload } from "../../../middlewares/multer.js";

const { create_form, read_form, delete_form } = webPermissions;

const app = express.Router();

app.post("/create", isAuthenticated, isAuthorized(create_form), singleUpload, createNewForm);
app.get("/my", isAuthenticated, isAuthorized(read_form), getMyallForms);

app
  .route("/single/:formId")
  .delete(isAuthenticated, isAuthorized(delete_form), deleteSingleForm)
  .get(isAuthenticated, isAuthorized(read_form), getSingleForm);

export default app;
