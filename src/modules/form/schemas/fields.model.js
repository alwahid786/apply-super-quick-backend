import mongoose from "mongoose";

export const formFieldSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
    label: { type: String, required: true },
    type: { type: String, required: true },
    placeholder: { type: String },
    required: { type: Boolean, default: false },
    displayText: { type: String },
    ai_support: { type: String },
    ai_formatting: { type: String },
  },
  { timestamps: true }
);

export const FormField = mongoose.model("FormField", formFieldSchema);
export default FormField;
