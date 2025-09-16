const company_info_fields = [
  {
    label: "Legal Company Name",
    type: "text",
    name: "legal_company_name",
    required: true,
    placeholder: "e.g. Example Inc.",
    aiHelp: false,
  },
  {
    label: "Website URL",
    type: "text",
    name: "website_url",
    required: true,
    placeholder: "https://example.com",
    aiHelp: false,
  },
  {
    label: "Compnay HQ Address",
    type: "text",
    name: "company_hq_address",
    required: true,
    placeholder: "e.g. 123 Main St., New York, NY 10001",
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
    label: "Company Founded Date",
    type: "date",
    name: "company_founded_date",
    required: true,
    placeholder: "e.g. 2000-01-01 (YYYY-MM-DD)",
    aiHelp: false,
    aiPrompt: "",
    aiResponse: ``,
  },

  {
    label: "Parent Company",
    type: "text",
    name: "parent_company",
    required: true,
    placeholder: "e.g. Parent Company",
    aiHelp: false,
    aiPrompt: "",
    aiResponse: ``,
  },

  {
    label: "DBA Name",
    type: "text",
    name: "dba_name",
    required: true,
    placeholder: "e.g. Example Corp.",
    aiHelp: false,
    aiPrompt: "What is the DBA name of the company?",
    aiResponse: ``,
  },
  {
    label: "Business Description",
    type: "text",
    name: "business_description",
    required: true,
    placeholder: "e.g. We deliver sustainable packaging...",
    aiHelp: false,
    aiPrompt: "What is the business description?",
    aiResponse: "The business description provides an overview of the company's operations.",
  },
];
const beneficial_fields = [
  {
    label:
      "Are you a primary operator (or one of the primary operators) and/or an owner of 25% or more of the company? Primary operator includes roles like president, CEO, CFO, president, general partner, managing member, sole proprietor, etc.",
    type: "radio",
    options: [
      { label: "Yes", value: "yes" },
      { label: "NO", value: "no" },
    ],
    name: "applicant_is_primary_operator_or_owner_with_more_then_25percentage",
    required: true,
    aiHelp: false,
  },

  {
    label: "Are there other primary operators and/or owners who own 25% or more of the company?",
    type: "radio",
    options: [
      { label: "Yes", value: "yes" },
      { label: "NO", value: "no" },
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
    label: "Debit/Credit Card Acceptance",
    type: "checkbox",
    name: "debit_credit_card_acceptance",
    required: false,
    aiHelp: false,
    conditional_fields: [
      {
        label: "Monthaly Doller Volume",
        type: "number",
        name: "monthly_dollar_volume",
        required: false,
      },
      {
        label: "Monthaly Transaction Count",
        type: "number",
        name: "monthly_transaction_count",
        required: false,
      },
    ],
  },
  {
    label: "Send ACH",
    type: "checkbox",
    name: "send_ach",
    required: true,
    aiHelp: false,
    conditional_fields: [
      {
        label: "Monthaly Doller Volume",
        type: "number",
        name: "monthly_dollar_volume",
        required: false,
      },
      {
        label: "Monthaly Transaction Count",
        type: "number",
        name: "monthly_transaction_count",
        required: false,
      },
    ],
  },
  {
    label: "Send Checks",
    type: "checkbox",
    name: "send_checks",
    required: true,
    aiHelp: false,
    conditional_fields: [
      {
        label: "Monthaly Doller Volume",
        type: "number",
        name: "monthly_dollar_volume",
        required: false,
      },
      {
        label: "Monthaly Transaction Count",
        type: "number",
        name: "monthly_transaction_count",
        required: false,
      },
    ],
  },
  {
    label: "Push to Card",
    type: "checkbox",
    name: "push_to_card",
    required: true,
    aiHelp: false,
    conditional_fields: [
      {
        label: "Monthaly Doller Volume",
        type: "number",
        name: "monthly_dollar_volume",
        required: false,
      },
      {
        label: "Monthaly Transaction Count",
        type: "number",
        name: "monthly_transaction_count",
        required: false,
      },
    ],
  },
  {
    label: "Pay to Virtual Card",
    type: "checkbox",
    name: "pay_to_virtual_card",
    required: true,
    aiHelp: false,
    conditional_fields: [
      {
        label: "Monthaly Doller Volume",
        type: "number",
        name: "monthly_dollar_volume",
        required: false,
      },
      {
        label: "Monthaly Transaction Count",
        type: "number",
        name: "monthly_transaction_count",
        required: false,
      },
    ],
  },
  {
    label: "Accounts Receivable Portal",
    type: "checkbox",
    name: "accounts_receivable_portal",
    required: true,
    aiHelp: false,
  },
  {
    label: "Accounts Payable Portal",
    type: "checkbox",
    name: "accounts_payable_portal",
    required: true,
    aiHelp: false,
  },
  {
    label: "Api Access",
    type: "checkbox",
    name: "api_access",
    required: true,
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
const applicantIsMainOwnerFields = [
  {
    label: "Please provide your Social Security Number (SSN).",
    type: "text",
    name: "applicant_ssn",
    required: true,
    placeholder: "e.g. 123-45-6789",
    aiHelp: false,
    isMasked: true,
  },

  {
    label: "What is your exact ownership percentage in the company? Enter 0 if none?",
    type: "range",
    name: "applicant_percentage",
    minValue: 0,
    maxValue: 100,
    defaultValue: 0,
    required: false,
    aiHelp: false,
  },
];
export {
  company_info_fields,
  beneficial_fields,
  bank_account_info_fields,
  average_transaction_fields,
  articleOfIncorporation_fields,
  applicantIsMainOwnerFields,
};
