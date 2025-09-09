import multer from "multer";

const singleUpload = multer({
  storage: multer.memoryStorage(),
  // limits: { fileSize: 10 * 1024 * 1024 },
}).single("file");

const multipleUpload = multer({
  storage: multer.memoryStorage(),
  // limits: { fileSize: 10 * 1024 * 1024 },
}).array("files");

export { multipleUpload, singleUpload };
