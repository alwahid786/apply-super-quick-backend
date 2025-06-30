import { parse } from "csv-parse/sync";

function convertCsvToActualFormData(csvInput) {
  // Ensure it's a string for the CSV parser
  const csvString = Buffer.isBuffer(csvInput) ? csvInput.toString("utf8") : csvInput;
  // Synchronously parse CSV into row objects
  const rows = parse(csvString, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  let formName = "";
  let formDescription = "";
  const sections = [];
  let currentSection = null;
  for (const row of rows) {
    currentSection = null;
    // 1) Forward-fill form-level properties
    if (row?.form_name) formName = row.form_name;
    if (row?.form_description) formDescription = row.form_description;
    // 2) Detect and start a new section
    const title = row?.section_title;
    if (!title) continue; // skip rows without a section title
    if (currentSection && currentSection.title === title) continue;
    // if section title is a block then only save section name and title and continue
    const isSectionBlock = title?.split("_")?.[title?.split("_")?.length - 1]?.toLowerCase()?.trim() == "blk";
    const isSectionCustom = title == "custom_section";
    // 3 if section is a block
    if (isSectionBlock) {
      currentSection = { title: title, name: row?.section_name, isBlock: true };
      const ai_formatting =
        row?.ai_formatting?.split(":")?.[0] == "section" ? row?.ai_formatting?.split(":")?.[1] : null;
      if (ai_formatting) currentSection.ai_formatting = ai_formatting;
      const ai_support = row?.ai_support?.split(":")?.[0] == "section" ? row?.ai_support?.split(":")?.[1] : null;
      if (ai_support) currentSection.ai_support = ai_support;
      const display_text = row?.display_text?.split(":")?.[0] == "section" ? row?.display_text?.split(":")?.[1] : null;
      if (display_text) currentSection.display_text = display_text;
      sections.push(currentSection);
      continue;
    }
    // 4 if section is a custom section
    if (isSectionCustom) {
      const sectionName = row?.section_name;
      const sectionTitle = row?.section_title;
      const isSectionAlreadyExist = sections.find(
        (section) => section?.name === sectionName && section?.title === sectionTitle
      );
      const ai_support = row?.ai_support?.split(":")?.[0] == "field" ? row?.ai_support?.split(":")?.[1] : null;
      const display_text = row?.display_text?.split(":")?.[0] == "field" ? row?.display_text?.split(":")?.[1] : null;
      const ai_formatting = row?.ai_formatting?.split(":")?.[0] == "field" ? row?.ai_formatting?.split(":")?.[1] : null;
      const formFieldObj = {};
      if (row?.field_label) formFieldObj.label = row?.field_label;
      if (row?.field_type) formFieldObj.type = row?.field_type;
      if (row?.field_required) formFieldObj.isRequired = row?.field_required;
      if (row?.field_placeholder) formFieldObj.placeholder = row?.field_placeholder;
      if (ai_formatting) formFieldObj.ai_formatting = ai_formatting;
      if (ai_support) formFieldObj.ai_support = ai_support;
      if (display_text) formFieldObj.display_text = display_text;
      // if sections already exist then update the fields else add new section
      if (isSectionAlreadyExist?.name === sectionName && Object.keys(formFieldObj).length) {
        isSectionAlreadyExist.fields.push(formFieldObj);
      } else {
        currentSection = { title: sectionTitle, name: sectionName, isBlock: false };
        const ai_formatting =
          row?.ai_formatting?.split(":")?.[0] == "section" ? row?.ai_formatting?.split(":")?.[1] : null;
        if (ai_formatting) currentSection.ai_formatting = ai_formatting;
        const ai_support = row?.ai_support?.split(":")?.[0] == "section" ? row?.ai_support?.split(":")?.[1] : null;
        if (ai_support) currentSection.ai_support = ai_support;
        const display_text =
          row?.display_text?.split(":")?.[0] == "section" ? row?.display_text?.split(":")?.[1] : null;
        if (display_text) currentSection.display_text = display_text;
        if (!currentSection?.fields) currentSection.fields = [];
        if (Object.keys(formFieldObj).length) currentSection.fields.push(formFieldObj);
        sections.push(currentSection);
      }
      continue;
    }
  }
  return {
    name: formName,
    description: formDescription,
    sections,
  };
}

export { convertCsvToActualFormData };
