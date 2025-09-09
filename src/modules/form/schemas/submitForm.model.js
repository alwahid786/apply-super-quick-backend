import mongoose from "mongoose";
import { SaveForm } from "./savedForm.mode.js";

const submitFormSchema = new mongoose.Schema(
  {
    form: { type: mongoose.Schema.Types.ObjectId, ref: "Form" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Auth" },
    submitData: { type: Object, required: true },
  },
  { timestamps: true }
);

submitFormSchema.post("save", async function (doc, next) {
  try {
    await SaveForm.deleteOne({ form: doc.form, user: doc.user });
    next();
  } catch (err) {
    next(err);
  }
});

export const SubmitForm = mongoose.model("SubmitForm", submitFormSchema);
