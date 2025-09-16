import mongoose from "mongoose";
import FormSection from "./sections.model.js";
import FormBlock from "./blocks.model.js";

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
    name: { type: String },
    aiHelp: { type: Boolean, default: false },
    options: { type: [{ label: String, value: String }] },
    minValue: { type: Number },
    maxValue: { type: Number },
    defaultValue: { type: String },
    isMasked: { type: Boolean, default: false },
    // additional fields for AI support
    conditional_fields: {
      type: [
        {
          label: { type: String },
          type: { type: String },
          name: { type: String },
          required: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    aiPrompt: { type: String },
    aiResponse: { type: String },
    isDisplayText: { type: Boolean, default: false },
    displayText: { type: String },
    ai_formatting: { type: String },
  },
  { timestamps: true }
);

// remove from all docs where it exists
formFieldSchema.post("findOneAndDelete", async function (doc) {
  if (doc?._id) {
    await Promise.all([
      FormSection.updateMany({ fields: doc._id }, { $pull: { fields: doc._id } }),
      FormBlock.updateMany({ fields: doc._id }, { $pull: { fields: doc._id } }),
    ]);
  }
});

export const FormField = mongoose.model("FormField", formFieldSchema);
export default FormField;
