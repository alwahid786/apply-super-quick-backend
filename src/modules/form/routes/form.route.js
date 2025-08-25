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

const {
  create_form,
  read_form,
  delete_form,
  submit_form,
  lookup_company,
  update_form,
  create_strategy,
  update_strategy,
  delete_strategy,
  read_strategy,
  create_prompt,
  update_prompt,
  read_prompt,
  delete_prompt,
  id_mission,
} = webPermissions;

const app = express.Router();

app.post("/create", isAuthenticated, isAuthorized(create_form), singleUpload, createNewForm);
app.get("/my", isAuthenticated, isAuthorized(read_form), getMyallForms);

app
  .route("/single/:formId")
  .delete(isAuthenticated, isAuthorized(delete_form), deleteSingleForm)
  .get(isAuthenticated, isAuthorized(read_form), getSingleForm);

app.post("/submit", isAuthenticated, isAuthorized(submit_form), submitForm);
app.post("/submit-article", isAuthenticated, singleUpload, isAuthorized(submit_form), submitFormArticleFile);
// app.post("/company-details", isAuthenticated, isAuthorized(lookup_company), getCompanyDetailsByUrl);
// for getting and updating beneficial owners info
app.get("/beneficial-owners", getBeneficialOwnersInfo);
app.put("/beneficial-owners", addBeneficialOwnersInfo);

// fields related routes
app.post("/update-delete-create-fields", isAuthenticated, isAuthorized(update_form), updateAddDeleteMultipleFields);
app.post("/create-field", isAuthenticated, addNewFormField);
app
  .route("/fields/:fieldId")
  .delete(isAuthenticated, isAuthorized(delete_form), deleteSingleFormField)
  .put(isAuthenticated, isAuthorized(create_form), updateSingleFormField)
  .get(isAuthenticated, isAuthorized(read_form), getSingleFormFields);

// other form related ai things
app.post("/formate-display-text", isAuthenticated, formateTextInMarkDown);

// routes for search strategies
// ============================
app.get("/search-strategy/all", isAuthenticated, isAuthorized(read_strategy), getAllSearchStrategies);
app.post("/search-strategy/create", isAuthenticated, isAuthorized(create_strategy), createSearchStrategy);
app
  .route("/search-strategy/single/:SearchStrategyId")
  .get(isAuthenticated, isAuthorized(read_strategy), createSearchStrategy)
  .put(isAuthenticated, isAuthorized(update_strategy), updateSearchStrategy)
  .delete(isAuthenticated, isAuthorized(delete_strategy), deleteSearchStrategy);

app.post("/create-prompt", isAuthenticated, isAuthorized(create_prompt), createPrompt);
app.put("/prompt/single/update", isAuthenticated, isAuthorized(update_prompt), updatePrompt);
app.get("/get-my-prompts", isAuthenticated, isAuthorized(read_prompt), getMyAllPrompts);

// company verification

app.post("/verify-company", isAuthenticated, isAuthorized(lookupCompany), verifyCompany);
app.post("/lookup-company", isAuthenticated, isAuthorized(lookup_company), lookupCompany);

export default app;
