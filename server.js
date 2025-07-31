import app from "./src/app.js";
import { getEnv } from "./src/configs/config.js";
import { connectDB } from "./src/configs/connectDb.js";
import { configureCloudinary } from "./src/global/utils/cloudinary.js";
import http from "http";
import { setupSocket } from "./src/global/utils/socketIo.js";

const port = getEnv("PORT");
const server = http.createServer(app);
// Setup Socket.IO
setupSocket(server);

(async () => {
  await configureCloudinary();
  await connectDB(getEnv("MONGODB_URL"));
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
