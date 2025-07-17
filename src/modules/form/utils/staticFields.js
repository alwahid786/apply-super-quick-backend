const company_info_fields = [
  {
    label: "Website URL",
    type: "text",
    name: "website_url",
    required: true,
    placeholder: "https://example.com",
    aiHelp: false,
  },
  {
    label: "Legal Company Name",
    type: "text",
    name: "legal_company_name",
    required: true,
    placeholder: "e.g. Example Inc.",
    aiHelp: false,
  },
  {
    label: "DBA Name",
    type: "text",
    name: "dba_name",
    required: true,
    placeholder: "e.g. Example Corp.",
    aiHelp: true,
    aiPrompt: "What is the DBA name of the company?",
    aiResponse: `# ✅ Understanding DBA (Doing Business As)

---

## 📌 What is a DBA?

> A **DBA (Doing Business As)** is a registered **trade name** that a company uses to operate under a different name than its official legal name.  
> It allows businesses to present a unique brand or identity while remaining the same legal entity.

---

## 📝 Definition

- A **DBA** allows a business to use a name other than its registered legal name.
- It is commonly used for branding, marketing, or business expansion.
- A **DBA does NOT create a separate legal entity**.

---

## 📋 Example

- **Legal Name:** XYZ Technologies Pvt. Ltd.
- **DBA Name:** XYZ Web Solutions
`,
  },
  {
    label: "Business Description",
    type: "text",
    name: "business_description",
    required: true,
    placeholder: "e.g. We deliver sustainable packaging...",
    aiHelp: true,
    aiPrompt: "What is the business description?",
    aiResponse: "The business description provides an overview of the company's operations.",
  },
  {
    label: "Business Classification",
    type: "text",
    name: "business_classification",
    required: true,
    placeholder: "e.g. We are a B Corporation...",
    aiHelp: false,
  },
  {
    label: "Legal Entity Type",
    type: "radio",
    options: [
      { label: "Limited Liability Company (LLC)", value: "llc" },
      { label: "Corporation (Inc.)", value: "corporation" },
      { label: "Limited Partnership (LTD)", value: "limited_partnership" },
      { label: "Sole Proprietorship", value: "sole_proprietorship" },
      { label: "Non-Profit", value: "non_profit" },
    ],
    name: "legal_entity_type",
    required: true,
    aiHelp: false,
  },
  {
    label: "Company Ownership Type",
    type: "radio",
    options: [
      { label: "Private", value: "private" },
      { label: "Public", value: "public" },
    ],
    name: "company_ownership_type",
    required: true,
    aiHelp: false,
  },
  {
    label: "SSN (Social Security Number)",
    type: "text",
    name: "ssn",
    required: true,
    placeholder: "e.g. 123-45-6789",
    aiHelp: false,
  },
  {
    label: "Street Address",
    type: "text",
    name: "street_address",
    required: true,
    placeholder: "e.g. 123 Main St.",
    aiHelp: false,
  },
  {
    label: "City",
    type: "text",
    name: "city",
    required: true,
    placeholder: "e.g. New York",
    aiHelp: false,
  },
  {
    label: "State",
    type: "text",
    name: "state",
    required: true,
    placeholder: "e.g. NY",
    aiHelp: false,
  },
  {
    label: "Country",
    type: "text",
    name: "country",
    required: true,
    placeholder: "e.g. United States",
    aiHelp: false,
  },
  {
    label: "Zip Code",
    type: "text",
    name: "zip_code",
    required: true,
    placeholder: "e.g. 10001",
    aiHelp: false,
  },
  {
    label: "Company Phone",
    type: "text",
    name: "company_phone",
    required: true,
    placeholder: "e.g. +1 123-456-7890",
    aiHelp: false,
  },
];
const beneficial_fields = [
  {
    label: "Are you the main owner?",
    type: "radio",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
    name: "applicant_is_main_owner",
    required: true,
    aiHelp: false,
  },

  {
    label: "Are there additional owners who own 25% or more of the company?",
    type: "radio",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
    name: "additional_owners_own_25_percent_or_more",
    required: true,
    aiHelp: false,
  },
  {
    label: "Additional Owner",
    name: "additional_owner",
    type: "block",
  },
];
const bank_account_info_fields = [
  {
    label: "Bank Name",
    type: "text",
    name: "bank_name",
    required: true,
    placeholder: "e.g. Bank of America",
    aiHelp: false,
  },
  {
    label: "Bank Account Number",
    type: "text",
    name: "bank_account_number",
    required: true,
    placeholder: "e.g. 1234567890",
    aiHelp: false,
  },
  {
    label: "Bank Routing Number",
    type: "text",
    name: "bank_routing_number",
    required: true,
    placeholder: "e.g. 123456789",
    aiHelp: false,
  },
  {
    label: "Bank Account Holder Name",
    type: "text",
    name: "bank_account_holder_name",
    required: true,
    placeholder: "e.g. John Doe",
    aiHelp: false,
  },
];
const average_transaction_fields = [
  {
    label: "Monthly Amount ($)",
    type: "number",
    name: "monthly_amount",
    required: true,
    placeholder: "e.g. 5000",
    aiHelp: false,
  },
  {
    label: "Processing Value ($)",
    type: "number",
    name: "processing_value",
    required: true,
    placeholder: "e.g. 1000",
    aiHelp: false,
  },
  {
    label: "Business Category",
    type: "text",
    name: "business_category",
    required: true,
    placeholder: "e.g. Real Estate",
    aiHelp: false,
  },
];
const articleOfIncorporation_fields = [
  {
    label: "Upload Article of Incorporation",
    type: "file",
    name: "article_of_incorporation",
    required: true,
    aiHelp: false,
  },
];

export {
  company_info_fields,
  beneficial_fields,
  bank_account_info_fields,
  average_transaction_fields,
  articleOfIncorporation_fields,
};
