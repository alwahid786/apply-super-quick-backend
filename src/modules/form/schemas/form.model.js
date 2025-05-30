import mongoose from "mongoose";
import { imageSchema } from "../../../global/schemas/global.model.js";

const formSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  description: { type: String },
  logo: { type: imageSchema },
  companyName: { type: String },
  sections: { type: [formSectionSchema], default: [] },
  aiTasks: { type: [aiTaskSchema], default: [] },
  dataLookupFields: { type: Map, of: dataLookupSchema, default: {} },
});

const Form = mongoose.model("Form", formSchema);
export default Form;

// helpers for form schema
// ----------------------

const formFieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  label: { type: String, required: true },
  name: { type: String, required: true },
  placeholder: { type: String },
  required: { type: Boolean, default: false },
  supportAIAssist: { type: Boolean, default: false },
  supportsDataLookup: { type: Boolean, default: false },
  dataLookupSource: { type: String },
  helpText: { type: String },
});

const formSectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  isRepeatable: { type: Boolean, default: false },
  minEntries: { type: Number, default: 1 },
  maxEntries: { type: Number, default: 10 },
  fields: [formFieldSchema],
});

const aiTaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  description: { type: String, required: true },
  fields: [{ type: String, required: true }],
  prompt: { type: String, required: true },
});

const dataLookupSchema = new mongoose.Schema({
  source: { type: String, required: true },
  targetFields: [{ type: String, required: true }],
});
