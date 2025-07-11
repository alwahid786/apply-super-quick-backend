import mongoose from "mongoose";

const createFormSectionsFields = (formData, user) => {
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
          if (field?.aiHelp) singleField.aiHelp = field?.aiHelp;
          if (field?.options) singleField.options = field?.options;
          if (field?.aiPrompt) singleField.aiPrompt = field?.aiPrompt;
          if (field?.aiResponse) singleField.aiResponse = field?.aiResponse;
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

  return { sections, fields, sectionIds };
};

export { createFormSectionsFields };
