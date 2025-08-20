import mongoose from "mongoose";

export const promptsSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
    name: { type: String, required: true },
    section: { type: String },
    prompt: { type: String, required: true },
  },
  { timestamps: true }
);

export const Prompt = mongoose.model("Prompt", promptsSchema);
export default Prompt;
