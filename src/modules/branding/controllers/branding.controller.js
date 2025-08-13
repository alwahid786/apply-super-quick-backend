import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { CustomError } from "../../../global/utils/customError.js";
import { Auth } from "../../auth/schemas/auth.model.js";
import Form from "../../form/schemas/form.model.js";
import { Branding } from "../schemas/branding.schema.js";
import { fetchBranding } from "../utils/extractTheme.js";

// extract theme
// -------------
const extractThemeFromUrl = asyncHandler(async (req, res, next) => {
  const { url } = req.body;
  console.log("req.body", url);
  if (!url) return next(new CustomError(400, "Please Provide url"));
  const data = await fetchBranding(url);
  return res.status(200).json({ success: true, data: data });
});

// create branding
// --------------
const createBranding = asyncHandler(async (req, res, next) => {
  const user = req.user;
  console.log("req.body", req.body);
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  if (!req.body) return next(new CustomError(400, "Please Provide body"));
  const { logos, colorPalette, name, url, colors, fontFamily } = req.body;
  if (!name || !url || !fontFamily || !colorPalette.length)
    return next(new CustomError(400, "Please Provide all fields"));
  const { primary, secondary, accent, link, text, background, frame } = colors;
  if (!primary || !secondary || !accent || !link || !text || !background || !frame)
    return next(new CustomError(400, "Please Provide all colors"));
  if (!logos?.length) return next(new CustomError(400, "Please Provide at least one logo"));

  const isExist = await Branding.findOne({
    owner: user?._id,
    name,
  });
  if (isExist) return next(new CustomError(400, "Branding Already Exists"));
  const newBranding = await Branding.create({
    owner: user?._id,
    logos,
    name,
    url,
    colorPalette,
    colors: { primary, secondary, accent, link, text, background, frame },
    fontFamily,
  });
  if (!newBranding) return next(new CustomError(400, "Error While Creating Branding"));
  return res.status(201).json({ success: true, message: "Branding Created Successfully" });
});

// get single branding
// ------------------
const getSingleBranding = asyncHandler(async (req, res, next) => {
  const user = req.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const { brandingId } = req.params;
  const branding = await Branding.findOne({ _id: brandingId });
  if (!branding) return next(new CustomError(400, "Branding Not Found"));
  return res.status(200).json({ success: true, data: branding });
});

// update single branding
// ----------------------
const updateSingleBranding = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const { logos, name, url, colorPalette, colors, fontFamily } = req.body;
  const { brandingId } = req.params;
  if (!brandingId) return next(new CustomError(400, "Branding ID is required"));
  if (!name || !url || !fontFamily || !colorPalette.length)
    return next(new CustomError(400, "Please Provide all fields"));
  const { primary, secondary, accent, link, text, background, frame } = colors;
  if (!primary || !secondary || !accent || !link || !text || !background || !frame)
    return next(new CustomError(400, "Please Provide all colors"));
  if (!logos?.length) return next(new CustomError(400, "Please Provide at least one logo"));

  const isExist = await Branding.findOne({
    _id: brandingId,
    owner: user?._id,
  });

  if (!isExist) return next(new CustomError(400, "Branding Not Found"));

  isExist.logos = logos;
  isExist.name = name;
  isExist.url = url;
  isExist.colorPalette = colorPalette;
  isExist.colors = { primary, secondary, accent, link, text, background, frame };
  isExist.fontFamily = fontFamily;
  const updatedBranding = await isExist.save();
  if (!updatedBranding) return next(new CustomError(400, "Error While Updating Branding"));
  return res.status(200).json({ success: true, message: "Branding Updated Successfully" });
});

// delete single branding
// ----------------------
const deleteSingleBranding = asyncHandler(async (req, res, next) => {
  const user = req.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const { brandingId } = req.params;
  const branding = await Branding.findOneAndDelete({ _id: brandingId });
  if (!branding) return next(new CustomError(400, "Branding Not Found"));
  return res.status(200).json({ success: true, message: "Branding Deleted Successfully" });
});

// get all branding
// ----------------
const getAllBrandings = asyncHandler(async (req, res, next) => {
  const user = req.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const branding = await Branding.find();
  if (!branding) return next(new CustomError(400, "Branding Not Found"));
  return res.status(200).json({ success: true, data: branding });
});

// add branding in form
// ----------------
const addBrandingInForm = asyncHandler(async (req, res, next) => {
  const user = req.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const { brandingId, formId, onHome } = req.body;
  if (!brandingId) return next(new CustomError(400, "Branding ID and Form ID are required"));
  if (!formId && !onHome == "yes") return next(new CustomError(400, "Form ID is required if onHome is not provided"));
  let message = "";
  if (formId) {
    const updateForm = await Form.findOneAndUpdate(
      { _id: formId, owner: user._id },
      { branding: brandingId },
      { new: true }
    );
    if (!updateForm) return next(new CustomError(400, "Form Not Found or User Not Authorized"));
    message = "Branding applied to form successfully";
  }
  if (onHome == "yes") {
    const updateUser = await Auth.findOneAndUpdate({ _id: user._id }, { branding: brandingId }, { new: true });
    if (!updateUser) return next(new CustomError(400, "User Not Found or User Not Authorized"));
    message = "Branding applied to user successfully";
  }
  return res.status(200).json({ success: true, message });
});

export {
  extractThemeFromUrl,
  createBranding,
  getSingleBranding,
  updateSingleBranding,
  deleteSingleBranding,
  getAllBrandings,
  addBrandingInForm,
};
