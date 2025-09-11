import mongoose from "mongoose";
import { imageSchema } from "../../../global/schemas/global.model.js";

const formSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
    branding: { type: mongoose.Schema.Types.ObjectId, ref: "Branding", default: null },
    brandingType: { type: String, default: "default" },
    name: { type: String, required: true },
    redirectUrl: { type: String },
    description: { type: String },
    branding: { type: mongoose.Schema.Types.ObjectId, ref: "Branding", default: null },
    logo: { type: imageSchema, default: null },
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "FormSection" }],
  },
  { timestamps: true }
);

const Form = mongoose.model("Form", formSchema);
export default Form;
