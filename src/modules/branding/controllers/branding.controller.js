import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { CustomError } from "../../../global/utils/customError.js";
import { Branding } from "../schemas/branding.schema.js";
import { fetchBranding } from "../utils/extractTheme.js";

// extract theme
// -------------
const extractThemeFromUrl = asyncHandler(async (req, res, next) => {
  const { url } = req.query;
  if (!url) return next(new CustomError(400, "Please Provide url"));
  // const data = await fetchBranding(url);
  return res.status(200).json({ success: true, data: [] });
});

// create branding
// --------------
const createBranding = asyncHandler(async (req, res, next) => {
  const user = req.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  if (!req.body) return next(new CustomError(400, "Please Provide body"));
  const { logo, name, url, colors, fontFamily } = req.body;
  if (!logo || !name || !url || !fontFamily) return next(new CustomError(400, "Please Provide all fields"));
  const { primary, secondary, accent, link, text, background, frame } = colors;
  if (!primary || !secondary || !accent || !link || !text || !background || !frame)
    return next(new CustomError(400, "Please Provide all colors"));
  const isExist = await Branding.findOne({
    owner: user?._id,
    logo,
    name,
    url,
    colors: { primary, secondary, accent, link, text, background, frame },
    fontFamily,
  });
  if (isExist) return next(new CustomError(400, "Branding Already Exists"));
  const newBranding = await Branding.create({ owner: user?._id, logo, name, url, colors, fontFamily });
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
  const { brandingId } = req.params;
  const branding = await Branding.findOne({ _id: brandingId });
  if (!branding) return next(new CustomError(400, "Branding Not Found"));
  if (!req.body) return next(new CustomError(400, "Please Provide at least one field"));
  const { logo, name, url, colors, fontFamily } = req.body;
  if (logo) branding.logo = logo;
  if (name) branding.name = name;
  if (url) branding.url = url;
  if (fontFamily) branding.fontFamily = fontFamily;
  if (colors) {
    const { primary, secondary, accent, link, text, background, frame } = colors;
    if (primary) branding.colors.primary = primary;
    if (secondary) branding.colors.secondary = secondary;
    if (accent) branding.colors.accent = accent;
    if (link) branding.colors.link = link;
    if (text) branding.colors.text = text;
    if (background) branding.colors.background = background;
    if (frame) branding.colors.frame = frame;
  }
  await branding.save();
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

export {
  extractThemeFromUrl,
  createBranding,
  getSingleBranding,
  updateSingleBranding,
  deleteSingleBranding,
  getAllBrandings,
};
