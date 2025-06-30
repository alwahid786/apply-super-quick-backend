import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { CustomError } from "../../../global/utils/customError.js";
import { convertCsvToActualFormData } from "../utils/csvParsingFunction.js";

const createNewForm = asyncHandler(async (req, res, next) => {
  const csvFile = req?.file;
  if (!csvFile) return next(new CustomError(400, "Please Provide CSV File"));
  const formData = convertCsvToActualFormData(csvFile.buffer);
  if (!formData) return next(new CustomError(400, "Error While Parsing CSV File"));
  return res.status(200).json({ success: true, data: formData });
});

export { createNewForm };
