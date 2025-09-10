import mongoose from "mongoose";

const brandingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    logos: {
      type: [
        {
          url: { type: String, required: true },
          type: { type: String, required: true },
          publicId: { type: String },
          invert: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    colorPalette: { type: [String], default: [] },
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
    selectedLogo: { type: String, default: "" }, // Add selectedLogo field
  },
  { timestamps: true }
);

export const Branding = mongoose.model("Branding", brandingSchema);
