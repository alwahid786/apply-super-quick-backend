import mongoose, { Types } from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    permissions: [{ type: Types.ObjectId, ref: "Permission" }] || [],
  },
  { timestamps: true }
);

export const Role = mongoose.model("Role", roleSchema);
