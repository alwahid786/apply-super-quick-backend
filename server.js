import app from "./src/app.js";
import { getEnv } from "./src/configs/config.js";
import { connectDB } from "./src/configs/connectDb.js";
import { configureCloudinary } from "./src/global/utils/cloudinary.js";
import http from "http";
import { setupSocket } from "./src/global/utils/socketIo.js";
import { addAllNewPermissionsInDb, addPermissionsInRoles } from "./src/configs/permissions.js";
import SearchStrategy from "./src/modules/form/schemas/searchStrategies.model.js";
import { strategiesData } from "../index.js";

const port = getEnv("PORT");
const server = http.createServer(app);
// Setup Socket.IO
setupSocket(server);

(async () => {
  await configureCloudinary();
  await connectDB(getEnv("MONGODB_URL"));
  // await addAllNewPermissionsInDb();
  // await addPermissionsInRoles();
  // await SearchStrategy.insertMany(strategiesData);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
})();
