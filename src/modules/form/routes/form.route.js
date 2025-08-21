import express from "express";
import { webPermissions } from "../../../configs/permissions.js";
import { isAuthenticated, isAuthorized } from "../../../middlewares/authMiddleware.js";
import {
  addBeneficialOwnersInfo,
  addNewFormField,
  createNewForm,
  deleteSingleForm,
  deleteSingleFormField,
  formateTextInMarkDown,
  getBeneficialOwnersInfo,
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
import {
  createPrompt,
  createSearchStrategy,
  deleteSearchStrategy,
  getAllSearchStrategies,
  getMyAllPrompts,
  lookupCompany,
  updatePrompt,
  updateSearchStrategy,
  verifyCompany,
} from "../controllers/searchStrategies.controller.js";

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
// for getting and updating beneficial owners info
app.get("/beneficial-owners", getBeneficialOwnersInfo);
app.put("/beneficial-owners", addBeneficialOwnersInfo);

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

// routes for search strategies
// ============================
app.get("/search-strategy/all", isAuthenticated, getAllSearchStrategies);
app.post("/search-strategy/create", isAuthenticated, createSearchStrategy);
app
  .route("/search-strategy/single/:SearchStrategyId")
  .get(isAuthenticated, createSearchStrategy)
  .put(isAuthenticated, updateSearchStrategy)
  .delete(isAuthenticated, deleteSearchStrategy);

app.post("/create-prompt", isAuthenticated, createPrompt);
app.put("/prompt/single/update", isAuthenticated, updatePrompt);
app.get("/get-my-prompts", isAuthenticated, getMyAllPrompts);

// company verification

app.post("/verify-company", isAuthenticated, verifyCompany);
app.post("/lookup-company", isAuthenticated, lookupCompany);

export default app;
