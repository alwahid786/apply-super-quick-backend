import { parse } from "csv-parse/sync";

function convertCsvToActualDataForForm(csvInput) {
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
    // 1) Forward-fill form-level properties
    if (row.form_name) {
      formName = row.form_name;
    }
    if (row.form_description) {
      formDescription = row.form_description;
    }

    // 2) Detect and start a new section
    const title = row.Section_title;
    if (!title) continue; // skip rows without a section title

    if (!currentSection || currentSection.title !== title) {
      currentSection = {
        title,
        description: row.Section_description || "",
        repeatable: String(row.Section_repeatable).toLowerCase() === "true",
        minEntries: row.Section_min_entries ? Number(row.Section_min_entries) : null,
        maxEntries: row.Section_max_entries ? Number(row.Section_max_entries) : null,
        fields: [],
      };
      sections.push(currentSection);
    }

    // 3) Map field columns into a field object
    const field = {
      name: row.field_name || "",
      label: row.field_label || "",
      type: row.field_type || "",
      required:
        String(row.field_required).toLowerCase() === "required" || String(row.field_required).toLowerCase() === "true",
      placeholder: row.field_placeholder || "",
      options: row.field_options
        ? row.field_options
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      helpText: row.field_help_text || "",
      supportsAI: String(row.field_supports_ai).toLowerCase() === "true",
      supportsLookup: String(row.field_supports_lookup).toLowerCase() === "true",
    };

    currentSection.fields.push(field);
  }

  return {
    name: formName,
    description: formDescription,
    sections,
  };
}

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
      const formFieldObj = {
        label: row?.field_label ?? "",
        type: row?.field_type ?? "",
        isRequired: Boolean(row?.field_required) ? true : false,
        placeholder: row?.field_placeholder ?? "",
      };

      // if sections already exist then update the fields else add new section
      if (isSectionAlreadyExist?.name === sectionName) {
        isSectionAlreadyExist.fields.push(formFieldObj);
      } else {
        currentSection = { title: sectionTitle, name: sectionName, fields: [formFieldObj], isBlock: false };
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

export { convertCsvToActualDataForForm, convertCsvToActualFormData };
