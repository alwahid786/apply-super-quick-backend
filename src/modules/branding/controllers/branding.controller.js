import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { uploadOnCloudinary } from "../../../global/utils/cloudinary.js";
import { CustomError } from "../../../global/utils/customError.js";
import { Auth } from "../../auth/schemas/auth.model.js";
import Form from "../../form/schemas/form.model.js";
import { Branding } from "../schemas/branding.schema.js";
import analyzeLogos from "../utils/detectLogo.js";
import { fetchBranding } from "../utils/extractTheme.js";

// extract theme
// -------------
const extractThemeFromUrl = asyncHandler(async (req, res, next) => {
  let { url } = req.body;
  if (!url) return next(new CustomError(400, "Please Provide url"));
  if (url.startsWith("http://")) return next(new CustomError(400, "Please Provide https url"));
  if (!url.startsWith("https://")) url = `https://${url}`;

  console.log("req.body", url);
  if (!url) return next(new CustomError(400, "Please Provide url"));
  const data = await fetchBranding(url);
  return res.status(200).json({ success: true, data: data });
}); // create branding
// --------------
const createBranding = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) return next(new CustomError(400, "User not found"));
  let files = req.files;
  let { logos, colorPalette, name, url, colors, fontFamily, selectedLogo } = req.body;
  colors = JSON.parse(colors, null, 2);
  logos = JSON.parse(logos, null, 2);
  colorPalette = JSON.parse(colorPalette, null, 2);

  if (!name || !url || !fontFamily || !Array.isArray(colorPalette) || !colorPalette.length)
    return next(new CustomError(400, "Please provide all fields"));

  const { primary, secondary, accent, link, text, background, frame } = colors || {};
  if (!primary || !secondary || !accent || !link || !text || !background || !frame) return next(new CustomError(400, "Please provide all colors"));

  if (!Array.isArray(logos) || !logos.length) return next(new CustomError(400, "Please provide at least one logo"));

  const isExist = await Branding.findOne({ owner: userId, name });
  if (isExist) return next(new CustomError(400, "Branding already exists"));

  const uploadClouds = await Promise.all(
    files.map(async (file) => {
      const result = await uploadOnCloudinary(file, "branding");
      return result;
    })
  );

  let urlWithCloudinaryImages = [
    ...logos,
    ...uploadClouds.map((cloudinaryImage) => ({
      url: cloudinaryImage.secure_url,
      type: "img",
      publicId: cloudinaryImage.public_id,
    })),
  ];

  urlWithCloudinaryImages = await Promise.all(
    urlWithCloudinaryImages.map(async (logo) => {
      try {
        const isLight = await analyzeLogos([logo.url]);
        console.log("[analyzeLogo] url:", logo.url, "=> avgLight:", isLight);

        return { ...logo, invert: !!isLight.invisible };
      } catch (err) {
        console.log("[analyzeLogo] url:", logo.url, "=> error:", err.message);

        return { ...logo, invert: false };
      }
    })
  );

  const branding = await Branding.create({
    owner: userId,
    logos: urlWithCloudinaryImages,
    name,
    url,
    colorPalette: colorPalette,
    colors: { primary, secondary, accent, link, text, background, frame },
    fontFamily,
    selectedLogo: selectedLogo || logos[0]?.url || logos[0],
  });

  return res.status(201).json({ success: true, message: "Branding created successfully", data: branding });
});

// update single branding
// ----------------------
const updateSingleBranding = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) return next(new CustomError(400, "User not found"));
  const files = req.files;
  const { brandingId } = req.params;
  let { logos, name, url, colorPalette, colors, fontFamily, selectedLogo } = req.body;
  colors = JSON.parse(colors, null, 2);
  logos = JSON.parse(logos, null, 2);
  colorPalette = JSON.parse(colorPalette, null, 2);

  if (!brandingId) return next(new CustomError(400, "Branding ID is required"));
  if (!name || !url || !fontFamily || !Array.isArray(colorPalette) || !colorPalette.length)
    return next(new CustomError(400, "Please provide all fields"));

  const { primary, secondary, accent, link, text, background, frame } = colors || {};
  if (!primary || !secondary || !accent || !link || !text || !background || !frame) return next(new CustomError(400, "Please provide all colors"));

  if (!Array.isArray(logos) || !logos.length) return next(new CustomError(400, "Please provide at least one logo"));

  const branding = await Branding.findOne({ _id: brandingId, owner: userId });
  if (!branding) return next(new CustomError(404, "Branding not found"));

  const uploadClouds = await Promise.all(
    files.map(async (file) => {
      const result = await uploadOnCloudinary(file, "branding");
      return result;
    })
  );

  let urlWithCloudinaryImages = [
    ...logos,
    ...uploadClouds.map((cloudinaryImage) => ({
      url: cloudinaryImage.secure_url,
      type: "img",
      publicId: cloudinaryImage.public_id,
    })),
  ];

  urlWithCloudinaryImages = await Promise.all(
    urlWithCloudinaryImages.map(async (logo) => {
      try {
        const isLight = await analyzeLogos([logo.url]);
        console.log("[analyzeLogo] url:", logo.url, "=> avgLight:", isLight);

        return { ...logo, invert: !!isLight.invisible };
      } catch (err) {
        console.log("[analyzeLogo] url:", logo.url, "=> error:", err.message);

        return { ...logo, invert: false };
      }
    })
  );

  branding.logos = urlWithCloudinaryImages;
  branding.name = name;
  branding.url = url;
  branding.colorPalette = colorPalette;
  branding.colors = { primary, secondary, accent, link, text, background, frame };
  branding.fontFamily = fontFamily;
  branding.selectedLogo = selectedLogo || logos[0]?.url || logos[0];

  await branding.save();
  return res.status(200).json({ success: true, message: "Branding updated successfully", data: branding });
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
    const updateForm = await Form.findOneAndUpdate({ _id: formId, owner: user._id }, { branding: brandingId }, { new: true });
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

export { extractThemeFromUrl, createBranding, getSingleBranding, updateSingleBranding, deleteSingleBranding, getAllBrandings, addBrandingInForm };
