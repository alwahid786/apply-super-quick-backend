import mongoose from "mongoose";
import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { removeFromCloudinary, uploadOnCloudinary } from "../../../global/utils/cloudinary.js";
import { CustomError } from "../../../global/utils/customError.js";
import FormField from "../schemas/fields.model.js";
import Form from "../schemas/form.model.js";
import FormSection from "../schemas/sections.model.js";
import { SubmitForm } from "../schemas/submitForm.model.js";
import { convertCsvToActualFormData } from "../utils/csvParsingFunction.js";
import { extractCompanyInfo } from "../utils/extractCompanyDetails.js";

const createNewForm = asyncHandler(async (req, res, next) => {
  const user = req?.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const csvFile = req?.file;
  console.log("csvFile", csvFile);
  if (!csvFile?.buffer) return next(new CustomError(400, "Please Provide CSV File"));
  const formData = convertCsvToActualFormData(csvFile?.buffer);
  if (!formData) return next(new CustomError(400, "Error While Parsing CSV File"));
  const isExist = await Form.findOne({ owner: user?._id, name: formData?.name });
  if (isExist) return next(new CustomError(400, "Form Already Exist with same name"));
  // now create a array of sections and fields with _id and save it
  const fields = [];
  const sections = [];
  const sectionIds = [];
  formData?.sections?.forEach((section) => {
    const sectionId = new mongoose.Types.ObjectId();
    sectionIds.push(String(sectionId));
    const singleSection = { _id: sectionId, owner: user?._id };
    if (section?.title) singleSection.title = section?.title;
    if (section?.name) singleSection.name = section?.name;
    if (section?.isBlock) singleSection.isBlock = section?.isBlock;
    if (section?.displayText) singleSection.displayText = section?.displayText;
    if (section?.ai_formatting) singleSection.ai_formatting = section?.ai_formatting;
    if (section?.ai_support) singleSection.ai_support = section?.ai_support;
    const fieldsIds = [];
    if (Array.isArray(section?.fields) && section?.fields?.length) {
      {
        section?.fields?.forEach((field) => {
          const fieldId = new mongoose.Types.ObjectId();
          fieldsIds.push(String(fieldId));
          const singleField = { _id: fieldId, owner: user?._id };
          if (field?.label) singleField.label = field?.label;
          if (field?.type) singleField.type = field?.type;
          if (field?.name) singleField.name = field?.name;
          if (field?.placeholder) singleField.placeholder = field?.placeholder;
          if (field?.required) singleField.required = field?.required;
          if (field?.displayText) singleField.displayText = field?.displayText;
          if (field?.ai_support) singleField.ai_support = field?.ai_support;
          if (field?.ai_formatting) singleField.ai_formatting = field?.ai_formatting;
          fields.push(singleField);
        });
      }
    }
    singleSection.fields = fieldsIds;
    sections.push(singleSection);
  });

  // create form
  const form = await Form.create({
    owner: user?._id,
    name: formData?.name,
    description: formData?.description,
    sections: sectionIds,
  });
  if (!form) return next(new CustomError(400, "Error While Creating Form"));
  // create sections
  const createdSections = await FormSection.insertMany(sections);
  if (!createdSections?.length) return next(new CustomError(400, "Error While Creating Sections"));
  // create fields
  const createdFields = await FormField.insertMany(fields);
  if (!createdFields?.length) return next(new CustomError(400, "Error While Creating Fields"));
  return res.status(200).json({ success: true, message: "Form Created Successfully", data: form });
});

const getMyallForms = asyncHandler(async (req, res, next) => {
  const user = req?.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const forms = await Form.find({ owner: user?._id }).populate({ path: "sections", populate: { path: "fields" } });
  if (!forms?.length) return next(new CustomError(400, "No Forms Found"));
  return res.status(200).json({ success: true, data: forms });
});

const getSingleForm = asyncHandler(async (req, res, next) => {
  const formId = req?.params?.formId;
  if (!isValidObjectId(formId)) return next(new CustomError(400, "Invalid Form Id"));
  const form = await Form.findById(formId).populate({ path: "sections", populate: { path: "fields" } });
  if (!form) return next(new CustomError(400, "Form Not Found"));
  return res.status(200).json({ success: true, data: form });
});

const deleteSingleForm = asyncHandler(async (req, res, next) => {
  const formId = req?.params?.formId;
  if (!isValidObjectId(formId)) return next(new CustomError(400, "Invalid Form Id"));
  const form = await Form.findByIdAndDelete(formId);
  if (!form) return next(new CustomError(400, "Form Not Found"));
  return res.status(200).json({ success: true, message: "Form Deleted Successfully" });
});

const submitForm = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;
  console.log(req.body);
  const { formId, formData } = req.body;
  if (!formId || !formData) return next(new CustomError(400, "Please Provide Form Id and Form Data"));
  const isFormExist = await Form.findById(formId);
  if (!isFormExist) return next(new CustomError(400, "Form Not Found"));
  const form = await SubmitForm.create({ formId, submitData: formData, user: userId });
  if (!form) return next(new CustomError(400, "Error While Creating Form Submission"));
  return res.status(200).json({ success: true, message: "Form Submitted Successfully", data: form });
});
let submitId = "";
let myCloud = "";
const submitFormArticleFile = asyncHandler(async (req, res, next) => {
  try {
    const file = req.file;
    console.log("filedata boyd", req.body);
    const { submissionId, name } = req.body;
    if (!submissionId || !name) throw new CustomError(400, "Please Provide Form Id and Form Data");
    submitId = submissionId;
    const isFormExist = await SubmitForm.findById(submissionId);
    if (!isFormExist) throw new CustomError(400, "Form Not Found");
    myCloud = await uploadOnCloudinary(file, "docs");
    if (!myCloud.public_id || !myCloud.secure_url) throw new CustomError(400, "Error While Uploading File");
    const formData = { ...isFormExist.submitData, [name]: { url: myCloud.secure_url, public_id: myCloud.public_id } };
    const updatedSubmit = await SubmitForm.findByIdAndUpdate(submissionId, { submitData: formData }, { new: true });
    if (!updatedSubmit) throw new CustomError(400, "Error While Uploading File");
    return res.status(200).json({ success: true, message: "File Uploaded Successfully" });
  } catch (error) {
    if (myCloud?.public_id) await removeFromCloudinary(myCloud.public_id, "docs");
    if (submitId) await SubmitForm.findByIdAndDelete(submitId);
    return next(new CustomError(400, "Error While Uploading File"));
  }
});

const getCompanyDetailsByUrl = asyncHandler(async (req, res, next) => {
  const { url } = req.body;
  if (!url) return next(new CustomError(400, "Please Provide Url"));
  const result = await extractCompanyInfo(url);
  return res.status(200).json({ success: true, data: result });
});
export {
  createNewForm,
  deleteSingleForm,
  getCompanyDetailsByUrl,
  getMyallForms,
  getSingleForm,
  submitForm,
  submitFormArticleFile,
};
