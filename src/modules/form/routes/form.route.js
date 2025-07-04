import express from "express";
import { webPermissions } from "../../../configs/permissions.js";
import { isAuthenticated, isAuthorized } from "../../../middlewares/authMiddleware.js";
import {
  createNewForm,
  deleteSingleForm,
  getMyallForms,
  getSingleForm,
  submitForm,
  submitFormArticleFile,
} from "../controllers/form.controller.js";
import { singleUpload } from "../../../middlewares/multer.js";

const { create_form, read_form, delete_form, submit_form } = webPermissions;

const app = express.Router();

app.post("/create", isAuthenticated, isAuthorized(create_form), singleUpload, createNewForm);
app.get("/my", isAuthenticated, isAuthorized(read_form), getMyallForms);

app
  .route("/single/:formId")
  .delete(isAuthenticated, isAuthorized(delete_form), deleteSingleForm)
  .get(isAuthenticated, isAuthorized(read_form), getSingleForm);

app.post("/submit", isAuthenticated, isAuthorized(submit_form), submitForm);
app.post("/submit-article", isAuthenticated, isAuthorized(submit_form), singleUpload, submitFormArticleFile);

export default app;
