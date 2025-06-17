import mongoose from "mongoose";

const brandingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    logo: { type: String, required: true },
    colors: {
      primary: { type: String, required: true },
      secondary: { type: String, required: true },
      accent: { type: String, required: true },
      link: { type: String, required: true },
      text: { type: String, required: true },
      background: { type: String, required: true },
      frame: { type: String, required: true },
    },
    fontFamily: { type: String, required: true },
  },
  { timestamps: true }
);

export const Branding = mongoose.model("Branding", brandingSchema);
