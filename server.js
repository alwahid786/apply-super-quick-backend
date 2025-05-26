import app from "./src/app.js";
import { getEnv } from "./src/configs/config.js";
import { connectDB } from "./src/configs/connectDb.js";
import { configureCloudinary } from "./src/utils/cloudinary.js";

const port = getEnv("PORT");

(async () => {
  await configureCloudinary();
  await connectDB(getEnv("MONGODB_URL"));
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
