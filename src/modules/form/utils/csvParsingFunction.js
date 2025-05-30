import { parse } from "csv-parse/sync";

const convertCsvToActualDataForForm = (csvFile) => {
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

export { convertCsvToActualDataForForm };
