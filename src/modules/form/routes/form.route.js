import express from "express";
import { webPermissions } from "../../../configs/permissions.js";
import { isAuthenticated, isAuthorized } from "../../../middlewares/authMiddleware.js";
import {
  addNewFormField,
  createNewForm,
  deleteSingleForm,
  deleteSingleFormField,
  formateTextInMarkDown,
  getCompanyDetailsByUrl,
  getMyallForms,
  getSingleForm,
  getSingleFormFields,
  submitForm,
  submitFormArticleFile,
  updateAddDeleteMultipleFields,
  updateSingleFormField,
} from "../controllers/form.controller.js";
import { singleUpload } from "../../../middlewares/multer.js";

const { create_form, read_form, delete_form, submit_form } = webPermissions;

const app = express.Router();

app.post("/create", isAuthenticated, isAuthorized(create_form), singleUpload, createNewForm);
app.get("/my", isAuthenticated, isAuthorized(read_form), getMyallForms);

app
  .route("/single/:formId")
  .delete(isAuthenticated, isAuthorized(delete_form), deleteSingleForm)
  .get(isAuthenticated, getSingleForm);

app.post("/submit", isAuthenticated, submitForm);
app.post("/submit-article", isAuthenticated, singleUpload, submitFormArticleFile);
app.post("/company-details", isAuthenticated, getCompanyDetailsByUrl);

// fields related routes
app.post("/update-delete-create-fields", isAuthenticated, isAuthorized(create_form), updateAddDeleteMultipleFields);

app.post("/create-field", isAuthenticated, addNewFormField);
app
  .route("/fields/:fieldId")
  .delete(isAuthenticated, isAuthorized(delete_form), deleteSingleFormField)
  .put(isAuthenticated, isAuthorized(create_form), updateSingleFormField)
  .get(isAuthenticated, isAuthorized(read_form), getSingleFormFields);

// other form related ai things
app.post("/formate-display-text", isAuthenticated, isAuthorized(create_form), formateTextInMarkDown);

export default app;
