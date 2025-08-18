import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { CustomError } from "../../../global/utils/customError.js";
import SearchStrategy from "../schemas/searchStrategies.model.js";

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

export {
  getAllSearchStrategies,
  createSearchStrategy,
  updateSearchStrategy,
  deleteSearchStrategy,
  getSingleSearchStrategy,
};
