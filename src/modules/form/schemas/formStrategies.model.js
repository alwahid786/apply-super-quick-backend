import mongoose from "mongoose";

const formStrategySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, unique: true },
    searchStrategies: [{ type: mongoose.Schema.Types.ObjectId, ref: "SearchStrategy" }],
    form: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

const FormStrategy = mongoose.model("FormStrategy", formStrategySchema);

export default FormStrategy;
