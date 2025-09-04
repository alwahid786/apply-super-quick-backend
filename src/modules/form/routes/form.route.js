import express from "express";
import { webPermissions } from "../../../configs/permissions.js";
import { isAuthenticated, isAuthorized } from "../../../middlewares/authMiddleware.js";
import { singleUpload } from "../../../middlewares/multer.js";
import {
  addBeneficialOwnersInfo,
  addNewFormField,
  createNewForm,
  deleteSingleForm,
  deleteSingleFormField,
  formateTextInMarkDown,
  getBeneficialOwnersInfo,
  getMyallForms,
  getSavedForm,
  getSingleForm,
  getSingleFormFields,
  saveFormInProgress,
  submitForm,
  submitFormArticleFile,
  updateAddDeleteMultipleFields,
  updateSingleFormField,
} from "../controllers/form.controller.js";
import {
  createFormStrategy,
  deleteFormStrategy,
  getAllFormStrategies,
  getFormStrategy,
  updateFormStrategy,
} from "../controllers/formStrategies.controller.js";
import {
  createDefaultStrategies,
  createPrompt,
  createSearchStrategy,
  deleteSearchStrategy,
  findNaicAndMcc,
  getAllSearchStrategies,
  getMyAllPrompts,
  getSingleSearchStrategy,
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
} = webPermissions;

const app = express.Router();

app.post("/create", isAuthenticated, isAuthorized(create_form), singleUpload, createNewForm);
app.get("/my", isAuthenticated, isAuthorized(read_form), getMyallForms);

app
  .route("/single/:formId")
  .delete(isAuthenticated, isAuthorized(delete_form), deleteSingleForm)
  .get(isAuthenticated, isAuthorized(read_form), getSingleForm);

app.post("/submit", isAuthenticated, isAuthorized(submit_form), submitForm);
app.post("/save-in-draft", isAuthenticated, isAuthorized(submit_form), saveFormInProgress);
app.get("/get-saved/:formId", isAuthenticated, isAuthorized(submit_form), getSavedForm);
app.post("/submit-article", isAuthenticated, singleUpload, isAuthorized(submit_form), submitFormArticleFile);
// app.post("/company-details", isAuthenticated, isAuthorized(lookup_company), getCompanyDetailsByUrl);
// for getting and updating beneficial owners info
app.get("/beneficial-owners", getBeneficialOwnersInfo);
app.put("/beneficial-owners", addBeneficialOwnersInfo);

// fields related routes
// ============================

app.post("/update-delete-create-fields", isAuthenticated, isAuthorized(update_form), updateAddDeleteMultipleFields);
app.post("/create-field", isAuthenticated, addNewFormField);
app
  .route("/fields/:fieldId")
  .delete(isAuthenticated, isAuthorized(delete_form), deleteSingleFormField)
  .put(isAuthenticated, isAuthorized(create_form), updateSingleFormField)
  .get(isAuthenticated, isAuthorized(read_form), getSingleFormFields);

// other form related ai things
// ============================
app.post("/formate-display-text", isAuthenticated, formateTextInMarkDown);

// routes for search strategies
// ============================
app.get("/search-strategy/all", isAuthenticated, isAuthorized(read_strategy), getAllSearchStrategies);
app.post("/search-strategy/create", isAuthenticated, isAuthorized(create_strategy), createSearchStrategy);
app.post("/search-strategy/create-default", isAuthenticated, isAuthorized(create_strategy), createDefaultStrategies);
app
  .route("/search-strategy/single/:SearchStrategyId")
  .get(isAuthenticated, isAuthorized(read_strategy), getSingleSearchStrategy)
  .put(isAuthenticated, isAuthorized(update_strategy), updateSearchStrategy)
  .delete(isAuthenticated, isAuthorized(delete_strategy), deleteSearchStrategy);

// routes for search strategies
// ============================
app.get("/form-strategy/all", isAuthenticated, isAuthorized(read_strategy), getAllFormStrategies);
app.post("/form-strategy/create", isAuthenticated, isAuthorized(create_strategy), createFormStrategy);
// app.post("/form-strategy/create-default", isAuthenticated, isAuthorized(create_strategy), createDefaultStrategies);
app
  .route("/form-strategy/single/:formStrategyId")
  .get(isAuthenticated, isAuthorized(read_strategy), getFormStrategy)
  .put(isAuthenticated, isAuthorized(update_strategy), updateFormStrategy)
  .delete(isAuthenticated, isAuthorized(delete_strategy), deleteFormStrategy);

// routes for extraction prompts
// ============================
app.post("/create-prompt", isAuthenticated, isAuthorized(create_prompt), createPrompt);
app.put("/prompt/single/update", isAuthenticated, isAuthorized(update_prompt), updatePrompt);
app.get("/get-my-prompts", isAuthenticated, isAuthorized(read_prompt), getMyAllPrompts);
// company verification
// ============================

app.post("/verify-company", isAuthenticated, isAuthorized(lookup_company), verifyCompany);
app.post("/lookup-company", isAuthenticated, isAuthorized(lookup_company), lookupCompany);
app.post("/find-naics-to-mcc", isAuthenticated, isAuthorized(submit_form), findNaicAndMcc);

export default app;
