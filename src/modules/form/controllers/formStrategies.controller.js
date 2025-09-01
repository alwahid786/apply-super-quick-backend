import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { CustomError } from "../../../global/utils/customError.js";
import FormStrategy from "../schemas/formStrategies.model.js";

// get all form strategies
// ==========================================
const getAllFormStrategies = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const formStrategies = await FormStrategy.find({ owner: user._id }).populate(["searchStrategies", "form"]);
  if (!formStrategies || !formStrategies?.length) return next(new CustomError("No form strategies found", 404));
  return res.status(200).json({ success: true, data: formStrategies });
});

// create new form strategy
// ==========================================
const createFormStrategy = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { name, searchStrategies, form, isActive } = req.body;
  const isExist = await FormStrategy.findOne({ owner: user._id, form });
  if (isExist) return next(new CustomError(400, "Form strategy already exist for this form"));
  if (!searchStrategies || !form || !name) return next(new CustomError(400, "All fields are required"));
  const formStrategy = await FormStrategy.create({ owner: user?._id, name, searchStrategies, form, isActive });
  return res.status(201).json({ success: true, message: "Form strategy created successfully" });
});

// get single form strategy
// ==========================================
const getFormStrategy = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { formStrategyId } = req.params;
  if (!isValidObjectId(formStrategyId)) return next(new CustomError(400, "Form strategy object key is required"));
  const formStrategy = await FormStrategy.findOne({ _id: formStrategyId, owner: user?._id });
  if (!formStrategy) return next(new CustomError(404, "Form strategy not found"));
  return res.status(200).json({ success: true, data: formStrategy });
});

// delete a form strategy
// ==========================================
const deleteFormStrategy = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { formStrategyId } = req.params;
  if (!isValidObjectId(formStrategyId)) return next(new CustomError(400, "Form strategy object key is required"));
  const deletedStrategy = await FormStrategy.findOneAndDelete({ _id: formStrategyId, owner: user?._id });
  if (!deletedStrategy) return next(new CustomError(404, "Form strategy not found"));
  return res.status(200).json({ success: true, message: "Form strategy deleted successfully" });
});

// update single form strategy
// ==========================================
const updateFormStrategy = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { formStrategyId } = req.params;
  if (!isValidObjectId(formStrategyId)) return next(new CustomError(400, "Form strategy object key is required"));
  const { searchStrategies, form, isActive } = req.body;
  const updatedStrategy = await FormStrategy.findOneAndUpdate(
    { _id: formStrategyId, owner: user?._id },
    { $set: { searchStrategies, form, isActive } },
    { new: true }
  );
  if (!updatedStrategy) return next(new CustomError(404, "Form strategy not found"));
  return res.status(200).json({ success: true, message: "Form strategy updated successfully" });
});

export { createFormStrategy, deleteFormStrategy, getAllFormStrategies, getFormStrategy, updateFormStrategy };
