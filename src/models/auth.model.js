import mongoose, { Types } from "mongoose";
import bcrypt from "bcrypt";
import { imageSchema } from "./global.model.js";

const authSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String },
    state: { type: String },
    country: { type: String },
    contact: { type: String },
    email: { type: String, required: true, unique: true },
    image: { type: imageSchema },
    password: { type: String, required: true, select: false },
    role: { type: Types.ObjectId, ref: "Role", required: true },
  },
  { timestamps: true }
);

authSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) return next();
  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;
  return next();
});

export const Auth = mongoose.model("Auth", authSchema);
