import mongoose from "mongoose";

const formSectionSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
    title: { type: String, required: true },
    name: { type: String, required: true },
    displayText: { type: String, default: "" },
    ai_support: { type: String, default: "" },
    ai_formatting: { type: String, default: "" },
    isBlock: { type: Boolean, default: false },
    isSignature: { type: Boolean, default: false },
    signature: { type: String, default: "" },
    fields: [{ type: mongoose.Schema.Types.ObjectId, ref: "FormField" }],
    blocks: [{ type: mongoose.Schema.Types.ObjectId, ref: "FormBlock" }],
  },
  { timestamps: true }
);

export const FormSection = mongoose.model("FormSection", formSectionSchema);
export default FormSection;
