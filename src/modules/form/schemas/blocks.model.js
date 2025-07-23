import mongoose from "mongoose";
import FormSection from "./sections.model.js";

export const formBlocksSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
    name: { type: String, required: true },
    fields: [{ type: mongoose.Schema.Types.ObjectId, ref: "FormField" }],
  },
  { timestamps: true }
);

// remove from all docs where it exists
formBlocksSchema.post("findOneAndDelete", async function (doc) {
  if (doc?._id) {
    await FormSection.updateMany({ fields: doc._id }, { $pull: { fields: doc._id } });
  }
});

export const FormBlock = mongoose.model("FormBlock", formBlocksSchema);
export default FormBlock;
