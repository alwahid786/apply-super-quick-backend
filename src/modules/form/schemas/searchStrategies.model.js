import mongoose from "mongoose";

const searchStrategySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    searchObjectKey: { type: String, required: true, unique: true },
    searchType: { type: String, default: null },
    searchTerms: { type: String, default: null },
    extractionPrompt: { type: String, default: null },
    extractAs: { type: String, default: "Simple text" },
    isActive: { type: Boolean, required: true, default: true },
    companyIdentification: {
      type: [String],
      required: true,
      default: ["Simple company name", "Legal company name", "Website URL"],
    },
    order: { type: Number, default: null },
  },
  { timestamps: true }
);

const SearchStrategy = mongoose.model("SearchStrategy", searchStrategySchema);

export default SearchStrategy;
