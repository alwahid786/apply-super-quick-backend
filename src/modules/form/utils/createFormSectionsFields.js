import mongoose, { isValidObjectId } from "mongoose";

const createFormSectionsFields = (formData, user) => {
  const fields = [];
  const sections = [];
  const sectionIds = [];
  const blocks = [];
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
          const singleField = { owner: user?._id };
          if (isValidObjectId(field?._id)) singleField._id = field?._id;
          else singleField._id = fieldId;
          if (field?.label) singleField.label = field?.label;
          if (field?.type) singleField.type = field?.type;
          if (field?.name) singleField.name = field?.name;
          if (field?.placeholder) singleField.placeholder = field?.placeholder;
          if (field?.required) singleField.required = field?.required;
          if (field?.aiHelp) singleField.aiHelp = field?.aiHelp;
          if (field?.options) singleField.options = field?.options;
          if (field?.minValue) singleField.minValue = field?.minValue;
          if (field?.maxValue) singleField.maxValue = field?.maxValue;
          if (field?.defaultValue) singleField.defaultValue = field?.defaultValue;
          if (field?.isMasked) singleField.isMasked = field?.isMasked;
          if (field?.aiPrompt) singleField.aiPrompt = field?.aiPrompt;
          if (field?.aiResponse) singleField.aiResponse = field?.aiResponse;
          if (field?.displayText) singleField.displayText = field?.displayText;
          if (field?.ai_support) singleField.ai_support = field?.ai_support;
          if (field?.ai_formatting) singleField.ai_formatting = field?.ai_formatting;
          if (field?.conditional_fields)
            singleField.conditional_fields = field?.conditional_fields?.map((f) => ({
              label: f.label,
              type: f.type,
              name: f.name,
              required: f.required,
            }));
          // console.log("conditional fields", field.conditional_fields?.[0]);
          fields.push(singleField);
        });
      }
    }
    const blockIds = [];
    if (Array.isArray(section?.blocks) && section?.blocks?.length) {
      section.blocks.forEach((block) => {
        const blockId = new mongoose.Types.ObjectId();
        blockIds.push(String(blockId));
        blocks.push({ owner: user?._id, _id: blockId, ...block });
        fieldsIds.push(String(blockId));
      });
    }
    singleSection.fields = fieldsIds;
    singleSection.blocks = blockIds;
    sections.push(singleSection);
  });

  return { sections, fields, sectionIds, blocks };
};

export { createFormSectionsFields };
