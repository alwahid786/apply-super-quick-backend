import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { removeFromCloudinary, uploadOnCloudinary } from "../../../global/utils/cloudinary.js";
import { CustomError } from "../../../global/utils/customError.js";
import FormField from "../schemas/fields.model.js";
import Form from "../schemas/form.model.js";
import FormSection from "../schemas/sections.model.js";
import { SubmitForm } from "../schemas/submitForm.model.js";
import { createFormSectionsFields } from "../utils/createFormSectionsFields.js";
import { convertCsvToActualFormData } from "../utils/csvParsingFunction.js";
import { extractCompanyInfo } from "../utils/extractCompanyDetails.js";
import mongoose from "mongoose";
import { openai } from "../../../configs/constants.js";
import FormBlock from "../schemas/blocks.model.js";
import { sendMail } from "../../../global/utils/sendMail.js";
import { Auth } from "../../auth/schemas/auth.model.js";
import { Role } from "../../role/schemas/role.model.js";
import { sendToken } from "../../../global/utils/sendToken.js";

let submitId = "";
let myCloud = "";

const createNewForm = asyncHandler(async (req, res, next) => {
  const user = req?.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const csvFile = req?.file;
  if (!csvFile?.buffer) return next(new CustomError(400, "Please Provide CSV File"));
  const formData = convertCsvToActualFormData(csvFile?.buffer);
  if (!formData) return next(new CustomError(400, "Error While Parsing CSV File"));
  const isExist = await Form.findOne({ owner: user?._id, name: formData?.name });
  if (isExist) return next(new CustomError(400, "Form Already Exist with same name"));
  // now create a array of sections and fields with _id and save it
  const { sections, fields, sectionIds, blocks } = createFormSectionsFields(formData, user);
  if (!sections?.length || !fields?.length || !sectionIds?.length) {
    return next(new CustomError(400, "Error While Creating Sections or Fields"));
  }

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
  // create blocks
  const createdBlocks = await FormBlock.insertMany(blocks);
  if (!createdBlocks?.length) return next(new CustomError(400, "Error While Creating Blocks"));
  // create fields
  const createdFields = await FormField.insertMany(fields);
  if (!createdFields?.length) return next(new CustomError(400, "Error While Creating Fields"));
  return res.status(200).json({ success: true, message: "Form Created Successfully", data: form });
});

const getMyallForms = asyncHandler(async (req, res, next) => {
  const user = req?.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));

  const forms = await Form.find({ owner: user?._id }).populate("branding");
  if (!forms?.length) return next(new CustomError(400, "No Forms Found"));
  return res.status(200).json({ success: true, data: forms });
});

const getSingleForm = asyncHandler(async (req, res, next) => {
  const formId = req?.params?.formId;
  if (!isValidObjectId(formId)) return next(new CustomError(400, "Invalid Form Id"));
  const form = await Form.findOne({ _id: formId })
    .populate({
      path: "sections",
      populate: [{ path: "fields" }, { path: "blocks", populate: { path: "fields" } }],
    })
    .populate("branding");
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
  // get emails which are also owner we need to send him a mail
  const beneficialOwnersEmails = [];
  if (formData?.beneficial_blk?.additional_owners_own_25_percent_or_more) {
    formData?.beneficial_blk?.additional_owner?.forEach((owner) => {
      beneficialOwnersEmails.push(owner?.email);
    });
  }
  const isFormExist = await Form.findById(formId);
  if (!isFormExist) return next(new CustomError(400, "Form Not Found"));
  const form = await SubmitForm.create({ formId, submitData: formData, user: userId });
  if (!form) return next(new CustomError(400, "Error While Creating Form Submission"));
  const mailSendPromises = [];
  beneficialOwnersEmails.forEach((email) => {
    const link = `http://localhost:5173/singleForm/owner?email=${email}&submitId=${form?._id}&userId=${userId}`;
    mailSendPromises.push(
      sendMail(email, "Form Submitted Successfully", `click on this link to verify your details : ${link}`)
    );
  });
  await Promise.all(mailSendPromises);
  return res.status(200).json({ success: true, message: "Form Submitted Successfully", data: form });
});

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
// fields controllers
// =================

const updateAddDeleteMultipleFields = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) return next(new CustomError(400, "User Not Found"));
  const { sectionId, fieldsData, ownerFieldsData } = req.body;
  if (!sectionId) return next(new CustomError(400, "Please Provide Section Id"));
  if (fieldsData?.length && Array.isArray(fieldsData)) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // 1) Fetch section
        const section = await FormSection.findOne({ _id: sectionId, owner: userId }).session(session);
        if (!section) throw new CustomError(400, "Section Not Found");

        // 2) Build update & insert ops
        const bulkOps = [];
        const newIds = [];
        for (const field of fieldsData) {
          if (field._id) {
            const { _id, ...data } = field;
            bulkOps.push({
              updateOne: {
                filter: { _id },
                update: { $set: data },
              },
            });
          } else {
            const _id = new mongoose.Types.ObjectId();
            newIds.push(_id);
            bulkOps.push({
              insertOne: {
                document: { _id, owner: userId, ...field },
              },
            });
          }
        }

        // 3) Handle deletes
        const incomingIds = fieldsData?.filter((f) => f._id).map((f) => String(f._id));
        const toDelete = section.fields.map((id) => String(id)).filter((id) => !incomingIds.includes(id));
        if (toDelete.length) {
          bulkOps.push({
            deleteMany: { filter: { _id: { $in: toDelete } } },
          });
        }

        // 4) Execute all in one bulkWrite
        if (bulkOps.length) {
          await FormField.bulkWrite(bulkOps, { session });
        }

        // 5) Update section.fields array
        section.fields = [...incomingIds.map((id) => String(id)), ...newIds.map((id) => String(id))];
        await section.save({ session });
      });

      res.status(200).json({ success: true, message: "Fields updated successfully" });
    } catch (err) {
      next(err instanceof CustomError ? err : new CustomError(500, err.message));
    } finally {
      session.endSession();
    }
  }
  // only for beneficial section
  // ============================
  if (ownerFieldsData?.length && Array.isArray(ownerFieldsData)) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // 1) Fetch section
        const section = await FormSection.findOne({ _id: sectionId, owner: userId }).session(session);
        if (!section) throw new CustomError(400, "Section Not Found");

        // 2) Build update
        const bulkOps = [];
        for (const field of ownerFieldsData) {
          const { _id, ...data } = field;
          bulkOps.push({
            updateOne: {
              filter: { _id },
              update: { $set: data },
            },
          });
        }
        // => 3) Execute all in one bulkWrite
        if (bulkOps.length) {
          await FormField.bulkWrite(bulkOps, { session });
        }
      });

      res.status(200).json({ success: true, message: "Fields updated successfully" });
    } catch (err) {
      next(err instanceof CustomError ? err : new CustomError(500, err.message));
    } finally {
      session.endSession();
    }
  }
});
const getSingleFormFields = asyncHandler(async (req, res, next) => {
  const user = req?.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const fieldId = req?.params?.fieldId;
  if (!isValidObjectId(fieldId)) return next(new CustomError(400, "Invalid Field Id"));
  const field = await FormField.findOne({ _id: fieldId, owner: user?._id });
  if (!field) return next(new CustomError(400, "Field Not Found"));
  return res.status(200).json({ success: true, data: field });
});

const updateSingleFormField = asyncHandler(async (req, res, next) => {
  const user = req?.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const fieldId = req?.params?.fieldId;
  if (!isValidObjectId(fieldId)) return next(new CustomError(400, "Invalid Field Id"));
  const fieldData = req.body;
  const updatedField = await FormField.findOneAndUpdate({ _id: fieldId, owner: user?._id }, fieldData, { new: true });
  if (!updatedField) return next(new CustomError(400, "Error While Updating Field"));
  return res.status(200).json({ success: true, data: updatedField });
});

const addNewFormField = asyncHandler(async (req, res, next) => {
  const user = req?.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const { sectionId, fieldData } = req.body;
  if (!sectionId) return next(new CustomError(400, "Please Provide Section Id"));
  const section = await FormSection.findOne({ _id: sectionId, owner: user?._id });
  if (!section) return next(new CustomError(400, "Section Not Found"));
  const newField = await FormField.create({ ...fieldData, owner: user?._id });
  if (!newField) return next(new CustomError(400, "Error While Creating Field"));
  section.fields.push(newField?._id);
  const updatedSection = await FormSection.findByIdAndUpdate(section._id, { fields: section.fields }, { new: true });
  if (!updatedSection) return next(new CustomError(400, "Error While Updating Section"));
  return res.status(200).json({ success: true, message: "Field Created Successfully", data: newField });
});

const deleteSingleFormField = asyncHandler(async (req, res, next) => {
  const user = req?.user;
  if (!user?._id) return next(new CustomError(400, "User Not Found"));
  const fieldId = req?.params?.fieldId;
  if (!isValidObjectId(fieldId)) return next(new CustomError(400, "Invalid Field Id"));
  const field = await FormField.findOneAndDelete({ _id: fieldId, owner: user?._id });
  if (!field) return next(new CustomError(400, "Field Not Found"));
  // remove field from section
  await FormSection.updateMany({ fields: fieldId }, { $pull: { fields: fieldId } });
  return res.status(200).json({ success: true, message: "Field Deleted Successfully" });
});

// other form related ai things
const formateTextInMarkDown = asyncHandler(async (req, res, next) => {
  const { text, instructions } = req.body;
  if (!text) return next(new CustomError(400, "Please Provide Text"));
  let systemPrompt = "";
  if (instructions) {
    systemPrompt = `
You are a text formatting assistant.
Your task: Format the provided text according to the user's instructions and return ONLY the raw formatted HTML.

STRICT RULES:
- Output must be valid HTML only.
- DO NOT include markdown fences like \`\`\`html or \`\`\`.
- DO NOT include explanations, commentary, or any extra text.
- DO NOT prepend or append anything — just return the HTML.
- Always use proper HTML tags (<div>, <table>, <ul>, <li>, <a>, etc.) with clean and professional inline styling.
- If the instructions cannot be followed, return the original text wrapped minimally in <div> tags.

User instructions: ${instructions}
Text to format: ${text}
Return only raw HTML below:
`;
  } else {
    systemPrompt = `
You are an AI assistant.

Your task: Read the user's question and provide the most accurate and complete answer possible, formatted strictly as raw HTML.

STRICT RULES:
- Your answer must directly answer the user question with accuracy and completeness.
- Output must be valid, well-structured HTML only.
- DO NOT include markdown fences (no \`\`\`html or \`\`\`).
- DO NOT include explanations, notes, or commentary outside the HTML.
- DO NOT prepend or append anything — return only the HTML content.
- Use semantic HTML tags (<div>, <p>, <table>, <ul>, <li>, <a>, <h1>-<h6>) as appropriate.
- Ensure clean, professional formatting with proper spacing and inline styles when needed.
- If the question cannot be answered, return the text "No valid answer found." wrapped in a <div> tag.

User question: ${text}

Return only the raw HTML answer below:
`;
  }
  const result = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0.1,
  });

  return res.status(200).json({ success: true, data: result.choices[0].message.content });
});

// for getting beneficial owners information
const getBeneficialOwnersInfo = asyncHandler(async (req, res, next) => {
  const { userId, submitId, email } = req.query;
  console.log(req.query);
  if (!isValidObjectId(userId) || !isValidObjectId(submitId) || !email)
    return next(new CustomError(400, "Invalidate data"));
  const submittedForm = await SubmitForm.findOne({ _id: submitId, user: userId });
  if (!submittedForm) return next(new CustomError(400, "Form Not Found"));
  const beneficialOwners = submittedForm?.submitData?.beneficial_blk?.additional_owner;
  if (!beneficialOwners?.length) return next(new CustomError(400, "No Beneficial Owners Found"));
  const currentOwnerData = beneficialOwners.find((owner) => owner?.email === email);
  if (!currentOwnerData) return next(new CustomError(400, "Beneficial Owner Not Found"));
  // create user as a guest user and send tokens
  let user = await Auth.findOne({ email });
  if (!user?._id) {
    const role = await Role.findOneAndUpdate({ name: "guest" }, { name: "guest" }, { upsert: true, new: true });
    if (!role) return next(new CustomError(400, "Error While Creating otp, Please Try Again Later"));
    user = await Auth.create({ firstName: "Guest", lastName: "User", role: role?._id, password: "guest", email });
  }
  if (!user) return next(new CustomError(400, "Error While Creating otp, Please Try Again Later"));
  return sendToken(res, next, user, 200, "Beneficial Owner Found", currentOwnerData);
});

// for getting beneficial owners information
const addBeneficialOwnersInfo = asyncHandler(async (req, res, next) => {
  const { userId, submitId } = req.query;
  if (!isValidObjectId(userId) || !isValidObjectId(submitId)) return next(new CustomError(400, "Invalid data"));
  const { name, email, ssn, percentage, isVerified, idMissionData } = req.body;
  if (!name || !email || !ssn || percentage === undefined || !idMissionData)
    return next(new CustomError(400, "Please fill all required fields"));
  const submittedForm = await SubmitForm.findOne({ _id: submitId, user: userId });
  if (!submittedForm) return next(new CustomError(404, "Form Not Found"));
  const beneficialOwners = submittedForm?.submitData?.beneficial_blk?.additional_owner;
  if (!beneficialOwners?.length) return next(new CustomError(400, "No Beneficial Owners Found"));
  const currentOwnerDataIndex = beneficialOwners.findIndex((owner) => owner?.email === email);
  if (currentOwnerDataIndex === -1) return next(new CustomError(404, "Beneficial Owner Not Found"));

  // Update owner data
  beneficialOwners[currentOwnerDataIndex] = {
    ...beneficialOwners[currentOwnerDataIndex],
    name,
    ssn,
    percentage,
    isVerified,
    idMissionData,
  };
  submittedForm.markModified("submitData.beneficial_blk.additional_owner");
  await submittedForm.save();
  return res.status(200).json({ success: true, message: "Beneficial Owner Updated Successfully" });
});

export {
  createNewForm,
  deleteSingleForm,
  getCompanyDetailsByUrl,
  getMyallForms,
  getSingleForm,
  submitForm,
  submitFormArticleFile,
  // fields related controllers
  updateAddDeleteMultipleFields,
  getSingleFormFields,
  updateSingleFormField,
  addNewFormField,
  deleteSingleFormField,
  // other form related ai things
  formateTextInMarkDown,
  // for getting and updating beneficial owners info
  getBeneficialOwnersInfo,
  addBeneficialOwnersInfo,
};
