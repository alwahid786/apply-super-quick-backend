import mongoose from "mongoose";

const submitFormSchema = new mongoose.Schema(
  {
    form: { type: mongoose.Schema.Types.ObjectId, ref: "Form" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Auth" },
    submitData: { type: Object, required: true },
  },
  { timestamps: true }
);

export const SubmitForm = mongoose.model("SubmitForm", submitFormSchema);
