import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { CustomError } from "../../../global/utils/customError.js";
import SearchStrategy from "../schemas/searchStrategies.model.js";
import Prompt from "../schemas/prompts.model.js";
import { verifyCompanyInformation } from "../utils/companyVerification.js";
import { executeCompanyLookup } from "../utils/companyLookup.js";
import { strategiesData } from "../utils/searchStrategiesData.js";
import { naicsToMcc } from "../../../../public/NAICStoMCC.js";
import { openai } from "../../../configs/constants.js";
import Form from "../schemas/form.model.js";

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
// create default strategies
// ========================
const createDefaultStrategies = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const existing = await SearchStrategy.find({ owner: user._id });
  if (existing.length)
    return next(new CustomError(400, "Default strategies cannot be created when you have strategies"));
  let defaultStrategies = strategiesData.map((data) => ({ ...data, owner: user?._id }));
  let newDefaultStrategies = await SearchStrategy.insertMany(defaultStrategies);
  return res
    .status(201)
    .json({ success: true, data: newDefaultStrategies, message: "Default strategies created successfully" });
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
  let { name, url } = req.body;
  if (!name || !url) return next(new CustomError(400, "Name and url is required"));
  if (url.startsWith("http://")) return next(new CustomError(400, "Please Provide https url"));
  if (!url.startsWith("https://")) url = `https://${url}`;

  // console.log("🔎 [VALIDATION] Validating Step 1 data...");
  // console.log("✅ [VALIDATION] Data validated successfully:", JSON.stringify(req.body, null, 2));
  const response = await verifyCompanyInformation(name, url);
  // console.log("📊 [STEP 1 COMPLETE] Verification result:", JSON.stringify(response, null, 2));
  // Store the verification result
  // console.log("💾 [STORAGE] Storing Step 1 verification result...");
  // const storedVerification = await storage.createCompanyVerification({
  //   originalCompanyName: response.originalCompanyName,
  //   verifiedCompanyName: response.originalCompanyName, // Keep original for now
  //   originalUrl: response.originalUrl,
  //   verifiedUrl: response.originalUrl, // Keep original for now
  //   isCompanyNameVerified: response.verificationStatus === "verified",
  //   isUrlVerified: response.verificationStatus === "verified",
  //   wasCompanyNameUpdated: false, // No updates in verification mode
  //   wasUrlFound: !!response.originalUrl,
  // });
  // console.log("✅ [STORAGE] Step 1 verification stored with ID:", storedVerification.id);
  res.status(200).json({ success: true, data: response });
});

// company lookup
// ==========================================
const lookupCompany = asyncHandler(async (req, res, next) => {
  const { _id: userId } = req.user;
  // console.log("\n🔍 [STEP 2] Starting company lookup process");
  let { name, url, formId } = req.body;
  if (url.startsWith("http://")) return next(new CustomError(400, "Please Provide https url"));
  if (!url.startsWith("https://")) url = `https://${url}`;

  try {
    if (!name || !url) return next(new CustomError(400, "Name and url is required"));
    if (!formId) return next(new CustomError(400, "Form id is required"));
    const isExist = await Form.findById(formId);
    if (!isExist) return next(new CustomError(400, "Form not found"));
    // console.log("🔎 [VALIDATION] Validating Step 2 data...");
    // console.log("✅ [VALIDATION] Data validated successfully:", JSON.stringify(req.body, null, 2));
    // Execute company lookup
    const lookupResult = await executeCompanyLookup(name, url, String(isExist?.owner), formId);

    // console.log(`📊 [STEP2-SUMMARY] Company: ${name || ""}`);
    // console.log(`📊 [STEP2-SUMMARY] Collection Rate: ${lookupResult.collectionRate}%`);
    // console.log(`📊 [STEP2-SUMMARY] Processing Time: ${lookupResult.processingTime}ms`);
    // console.log(`📊 [STEP2-SUMMARY] API Calls: ${lookupResult.apiCallsUsed}`);
    // console.log(`📊 [STEP2-SUMMARY] Status: ${lookupResult.status.toUpperCase()}`);

    res.status(200).json({
      success: true,
      data: {
        lookupData: lookupResult.collectedData,
        collectionRate: lookupResult.collectionRate,
        lookupStatus: lookupResult.status,
        message: `Collected ${lookupResult.collectionRate}% of company information`,
      },
    });
  } catch (error) {
    console.error("❌ [ERROR] Step 2 lookup failed:", error);

    // Provide more detailed error information
    let errorMessage = "Failed to lookup company information";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific error types and provide appropriate responses
      if (errorMessage.includes("connection") || errorMessage.includes("database") || errorMessage.includes("pool")) {
        errorMessage = "Database connection error. Please try again in a moment.";
        statusCode = 503; // Service Unavailable
      } else if (errorMessage.includes("API") || errorMessage.includes("fetch") || errorMessage.includes("network")) {
        errorMessage = "External API error. Please try again later.";
        statusCode = 502; // Bad Gateway
      } else if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
        errorMessage = "Request timed out. Please try again.";
        statusCode = 408; // Request Timeout
      } else if (errorMessage.includes("validation") || errorMessage.includes("parse")) {
        errorMessage = "Invalid request data. Please check your input.";
        statusCode = 400; // Bad Request
      }

      // Log detailed error for debugging
      console.error("❌ [ERROR-STACK]:", error.stack);
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      data: {
        error: errorMessage,
        type: "lookup_error",
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// find naic and mcc using open ai
// ==========================================
const findNaicAndMcc = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { description } = req.body;
  if (!description) return next(new CustomError(400, "Description is required"));
  const context = `
You are a classifier. I have a mapping of NAICS codes to MCC codes.
Here are some examples (NAICS, MCC):
${naicsToMcc
  .map(
    (item) =>
      `${item?.["NAICS Code"]},${item?.["NAICS Description"]} => ${item?.["MCC Code"]},${item?.["MCC Description"]}`
  )
  .join("\n")}

Task:
Given this business description: "${description}",
1. Pick 4 NAICS code that best matches it.
2. One of the 4 NAICS codes should be the best match and 3 other which also matches.
3. If an MCC exists for that NAICS, return it as well.
4. Respond strictly in JSON like:
5. Not any extra word or text in the response other than the JSON.
example formate: {
'bestMatch':{ "naics": "number", naicsDescription: "string", "mcc": "number" , "mccDescription": "string" },
otherMatches:[
{ "naics": "number", naicsDescription: "string", "mcc": "number" , "mccDescription": "string" },
{ "naics": "number", naicsDescription: "string", "mcc": "number" , "mccDescription": "string" },
{ "naics": "number", naicsDescription: "string", "mcc": "number" , "mccDescription": "string" }
]
}
If MCC is missing, use null for "mcc".
    `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: context }],
    response_format: { type: "json_object" },
    temperature: 0,
  });

  const response = completion.choices[0].message.content;
  res.status(200).json({ success: true, data: JSON.parse(response) });
});

export {
  getAllSearchStrategies,
  createSearchStrategy,
  createDefaultStrategies,
  updateSearchStrategy,
  deleteSearchStrategy,
  getSingleSearchStrategy,
  createPrompt,
  updatePrompt,
  getMyAllPrompts,
  verifyCompany,
  lookupCompany,
  findNaicAndMcc,
};
