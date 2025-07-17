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
    name: { type: String },
    aiHelp: { type: Boolean, default: false },
    options: { type: [{ label: String, value: String }] },
    aiPrompt: { type: String },
    aiResponse: { type: String },
    // additional fields for AI support
    displayText: { type: String },
    ai_support: { type: String },
    ai_formatting: { type: String },
  },
  { timestamps: true }
);

// remove from all docs where it exists
formFieldSchema.post("findOneAndDelete", async function (doc) {
  if (doc?._id) {
    await FormSection.updateMany(
      { fields: doc._id }, // If the field exists in the array
      { $pull: { fields: doc._id } } // Remove it
    );
  }
});

export const FormField = mongoose.model("FormField", formFieldSchema);
export default FormField;
