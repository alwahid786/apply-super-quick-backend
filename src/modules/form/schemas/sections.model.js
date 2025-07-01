import mongoose, { mongo } from "mongoose";

const formSectionSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
    title: { type: String, required: true },
    name: { type: String, required: true },
    displayText: { type: String },
    ai_support: { type: String },
    ai_formatting: { type: String },
    isBlock: { type: Boolean, default: false },
    fields: [{ type: mongoose.Schema.Types.ObjectId, ref: "FormField" }],
  },
  { timestamps: true }
);

export const FormSection = mongoose.model("FormSection", formSectionSchema);
export default FormSection;
