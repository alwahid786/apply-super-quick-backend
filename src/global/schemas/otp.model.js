import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
});

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 }); // 5 minutes

export const Otp = mongoose.model("Otp", otpSchema);
