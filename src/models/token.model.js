import mongoose from "mongoose";

// token schema
const tokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
  },
  { timestamps: true }
);

// auto matic remove after 30 days
tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const Token = mongoose.model("Token", tokenSchema);
