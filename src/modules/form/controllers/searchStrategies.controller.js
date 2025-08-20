import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { CustomError } from "../../../global/utils/customError.js";
import SearchStrategy from "../schemas/searchStrategies.model.js";
import Prompt from "../schemas/prompts.model.js";

// get all search strategies
// ==========================================
const getAllSearchStrategies = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const searchStrategies = await SearchStrategy.find({ owner: user._id });
  if (!searchStrategies || !searchStrategies?.length) return next(new CustomError("No search strategies found", 404));
  return res.status(200).json({ success: true, data: searchStrategies });
});
// create a new search strategy
// ==========================================
const createSearchStrategy = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const {
    searchObjectKey,
    searchType,
    searchTerms,
    extractionPrompt,
    extractAs,
    active,
    companyIdentification,
    order,
  } = req.body;

  console.log(req.body);
  if (!searchObjectKey || !extractionPrompt) return next(new CustomError(400, "All fields are required"));

  const existingStrategy = await SearchStrategy.findOne({ searchObjectKey, userId: user._id });
  if (existingStrategy) return next(new CustomError(400, "Search strategy with this key already exists"));

  const dataForAdd = { owner: user?._id, searchObjectKey, extractionPrompt };
  if (searchType) dataForAdd.searchType = searchType;
  if (searchTerms) dataForAdd.searchTerms = searchTerms;
  if (extractAs) dataForAdd.extractAs = extractAs;
  if (active) dataForAdd.isActive = active;
  if (!active) dataForAdd.isActive = false;
  if (companyIdentification?.length) dataForAdd.companyIdentification = companyIdentification;
  if (order !== undefined) dataForAdd.order = order;

  const newSearchStrategy = await SearchStrategy.create({ ...dataForAdd, userId: user._id });
  return res.status(201).json({ success: true, data: newSearchStrategy });
});
// update an existing search strategy
// ==========================================
const updateSearchStrategy = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { SearchStrategyId } = req.params;
  if (!isValidObjectId(SearchStrategyId)) return next(new CustomError(400, "Search object key is required"));

  console.log("req.body", req.body);
  const {
    searchObjectKey,
    searchType,
    searchTerms,
    extractionPrompt,
    extractAs,
    active,
    companyIdentification,
    order,
  } = req.body;
  if (!searchObjectKey || !extractionPrompt) return next(new CustomError(400, "All fields are required"));

  const existingStrategy = await SearchStrategy.findOne({ _id: SearchStrategyId, owner: user?._id });
  if (!existingStrategy) return next(new CustomError(404, "Search strategy not found"));
  const dataForUpdate = { extractionPrompt, searchObjectKey };
  if (searchType) dataForUpdate.searchType = searchType;
  if (searchTerms) dataForUpdate.searchTerms = searchTerms;
  if (extractAs) dataForUpdate.extractAs = extractAs;
  if (active) dataForUpdate.isActive = active;
  if (!active) dataForUpdate.isActive = false;
  if (companyIdentification?.length) dataForUpdate.companyIdentification = companyIdentification;
  if (order !== undefined) dataForUpdate.order = order;
  const updatedSearchStrategy = await SearchStrategy.findOneAndUpdate(
    { _id: SearchStrategyId, owner: user._id },
    dataForUpdate,
    { new: true }
  );
  if (!updatedSearchStrategy) return next(new CustomError(500, "Failed to update search strategy"));
  return res.status(200).json({ success: true, data: updatedSearchStrategy });
});
// get single search strategy
// ==========================================
const getSingleSearchStrategy = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { SearchStrategyId } = req.params;
  if (!isValidObjectId(SearchStrategyId)) return next(new CustomError("Search object key is required", 400));

  const searchStrategy = await SearchStrategy.findOne({ _id: SearchStrategyId, userId: user._id });
  if (!searchStrategy) return next(new CustomError("Search strategy not found", 404));

  return res.status(200).json({ success: true, data: searchStrategy });
});
// delete a search strategy
// ==========================================
const deleteSearchStrategy = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { SearchStrategyId } = req.params;
  if (!isValidObjectId(SearchStrategyId)) return next(new CustomError(400, "Search object key is required"));

  const deletedStrategy = await SearchStrategy.findOneAndDelete({ _id: SearchStrategyId, owner: user?._id });
  if (!deletedStrategy) return next(new CustomError(404, "Search strategy not found"));

  return res.status(200).json({ success: true, message: "Search strategy deleted successfully" });
});

// create prompt
// ==========================================
const createPrompt = asyncHandler(async (req, res, next) => {
  const { prompt, name } = req.body;
  if (!prompt || !name) return next(new CustomError(400, "Prompt and name is required"));
  const isExist = await Prompt.findOne({ owner: req?.user?._id, name });
  if (isExist) return next(new CustomError(400, "Prompt already exist"));
  const newPrompt = await Prompt.create({ owner: req?.user?._id, prompt, name });
  if (!newPrompt) return next(new CustomError(500, "Failed to create prompt"));
  return res.status(200).json({ success: true, message: "Prompt created successfully" });
});
// update prompt
// ==========================================
const updatePrompt = asyncHandler(async (req, res, next) => {
  const { prompt, name, section } = req.body;
  console.log("req.body", req.body);
  if (!prompt || !name || !section) return next(new CustomError(400, "Prompt, name and section is required"));
  const isExist = await Prompt.findOne({ owner: req?.user?._id, name });
  if (!isExist) return next(new CustomError(400, "Prompt not found"));
  const updatedPrompt = await Prompt.findOneAndUpdate(
    { owner: req?.user?._id, name },
    { prompt, section },
    { new: true }
  );
  if (!updatedPrompt) return next(new CustomError(500, "Failed to update prompt"));
  return res.status(200).json({ success: true, message: "Prompt updated successfully" });
});
// get all my prompts
// ==========================================
const getMyAllPrompts = asyncHandler(async (req, res, next) => {
  const prompts = await Prompt.find({ owner: req?.user?._id });
  if (!prompts) return next(new CustomError(500, "Failed to get prompts"));
  return res.status(200).json({ success: true, data: prompts });
});

// company verification
// ==========================================
const verifyCompany = asyncHandler(async (req, res, next) => {
  console.log("\n🔍 [STEP 1] Starting company verification process");
  console.log("📥 [REQUEST] Raw request body:", JSON.stringify(req.body, null, 2));

  try {
    // Validate request body (only require companyName and websiteUrl for Step 1)
    console.log("🔎 [VALIDATION] Validating Step 1 data...");
    const validatedData = verifyCompanySchema.parse(req.body);
    console.log("✅ [VALIDATION] Data validated successfully:", JSON.stringify(validatedData, null, 2));

    const response = await verifyCompanyInformation(validatedData);
    console.log("📊 [STEP 1 COMPLETE] Verification result:", JSON.stringify(response, null, 2));

    // Store the verification result
    console.log("💾 [STORAGE] Storing Step 1 verification result...");
    const storedVerification = await storage.createCompanyVerification({
      originalCompanyName: response.originalCompanyName,
      verifiedCompanyName: response.originalCompanyName, // Keep original for now
      originalUrl: response.originalUrl,
      verifiedUrl: response.originalUrl, // Keep original for now
      isCompanyNameVerified: response.verificationStatus === "verified",
      isUrlVerified: response.verificationStatus === "verified",
      wasCompanyNameUpdated: false, // No updates in verification mode
      wasUrlFound: !!response.originalUrl,
    });
    console.log("✅ [STORAGE] Step 1 verification stored with ID:", storedVerification.id);

    res.json(response);
  } catch (error) {
    console.error("❌ [ERROR] Step 1 verification failed:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to verify company information",
    });
  }
});
export {
  getAllSearchStrategies,
  createSearchStrategy,
  updateSearchStrategy,
  deleteSearchStrategy,
  getSingleSearchStrategy,
  verifyCompany,
  createPrompt,
  updatePrompt,
  getMyAllPrompts,
};
