import mongoose from "mongoose";

const saveFormSchema = new mongoose.Schema(
  {
    form: { type: mongoose.Schema.Types.ObjectId, ref: "Form" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Auth" },
    savedData: { type: Object, required: true },
  },
  { timestamps: true }
);

export const SaveForm = mongoose.model("SaveForm", saveFormSchema);
