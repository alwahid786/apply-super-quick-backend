import { parse } from "csv-parse/sync";

const convertCsvToAsctualDataForForm = (csvFile) => {
  try {
    const csvData = csvFile.buffer.toString("utf-8");
    const records = parse(csvData, { columns: true, skip_empty_lines: true, trim: true });
    console.log(`Parsed ${records.length} rows from CSV file`);
    if (records.length > 0) console.log("CSV columns:", Object.keys(records[0]));
    // Get form name from first row
    let formName = "Sample Form";
    if (records?.length > 0) formName = records?.[0]?.form_name || formName;
    console.log(`Form name: "${formName}"`);
    // Initialize sections map
    const sections = {};
    // IMPORTANT: We need to preserve exact order from CSV
    records.forEach((row, i) => {
      const sectionTitle = row?.section_title || `section-${i}`;
      const sectionDescription = row?.section_description;
      const field = {
        name: row?.field_name,
        label: row?.field_label,
        type: row?.field_type,
        required: row?.field_required === "true",
        options: row?.field_options
          ? row?.field_options.split(";").map((option) => {
              const [value, label] = option?.split(":");
              return { value, label };
            })
          : [],
      };
      // Check if section already exists
      if (!sections[sectionTitle])
        sections[sectionTitle] = { title: sectionTitle, description: sectionDescription, fields: [] };
      sections[sectionTitle].fields.push(field);
    });
    // Convert sections map to array and create final form configuration
    const sectionList = Object.values(sections);
    const formConfig = {
      name: formName,
      description: `Form configuration for ${formName}`,
      sections: sectionList,
      aiTasks: [],
      dataLookupFields: {},
    };
    return formConfig;
  } catch (error) {
    console.log("error while creating form in testing", error);
    return null;
  }
};

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

export { convertCsvToActualDataForForm };
