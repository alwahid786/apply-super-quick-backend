import http from "http";
import app from "./src/app.js";
import { getEnv } from "./src/configs/config.js";
import { connectDB } from "./src/configs/connectDb.js";
import { configureCloudinary } from "./src/global/utils/cloudinary.js";
import { setupSocket } from "./src/global/utils/socketIo.js";
import analyzeLogos from "./src/modules/branding/utils/detectLogo.js";

const port = getEnv("PORT");
const server = http.createServer(app);
// Setup Socket.IO
setupSocket(server);
console.log("a gai aaa");
console.log("a gai aaa");
console.log("a gai aaa");
console.log("a gai aaa");
(async () => {
  await configureCloudinary();
  await connectDB(getEnv("MONGODB_URL"));
  // await addAllNewPermissionsInDb();
  // await addPermissionsInRoles();

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
})();
