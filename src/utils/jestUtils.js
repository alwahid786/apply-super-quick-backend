import mongoose from "mongoose";
import { asyncHandler } from "./asyncHandler.js";
import { Auth } from "../models/auth.model.js";
import { Role } from "../models/role.model.js";
import { CustomError } from "../utils/customError.js";
import { getEnv } from "../configs/config.js";

// before we start testing testing
const beforeTestFunction = async () => {
  try {
    process.env.NODE_ENV = "test";
    await mongoose.disconnect();
    const testDbUrl = getEnv("MONGODB_URL_TEST");
    const testDbName = getEnv("MONGODB_NAME_TEST");
    const res = await mongoose.connect(testDbUrl, { dbName: testDbName });
    if (!res.connection.readyState === 1) return console.error("BEFORE TEST :Failed to connect to DB");
    if (mongoose?.connection?.db?.databaseName == testDbName) {
      await mongoose.connection.dropDatabase();
      console.log(`BEFORE TEST :${res?.connection?.db?.databaseName} connected and  dropped successfully`);
    }
  } catch (error) {
    console.error("BEFORE TEST :Failed to complete before all func in testing:", error);
    process.exit(1);
  }
};
// after we start testing testing
const afterTestFunction = async () => {
  try {
    const dbName = mongoose?.connection?.db?.databaseName;
    await mongoose.connection.dropDatabase();
    if (dbName == getEnv("MONGODB_NAME_TEST")) {
      await mongoose.disconnect();
      console.log(`AFTER TEST : ${dbName} connection closed and dropped successfully`);
    }
  } catch (error) {
    console.error("AFTER TEST :Failed to complete after all func in testing:", error);
    process.exit(1);
  }
};

const createUserWithOutAuthorizing = async ({ firstName, lastName, email, password, role }) => {
  try {
    if (!firstName || !lastName || !email || !password || !role) return false;
    const [user, roleExist] = await Promise.all([Auth.findOne({ email }), Role.findOne({ name: role })]);
    if (user?._id) return false;
    if (!roleExist) return false;
    const newUser = await Auth.create({ firstName, lastName, email, password, role: roleExist?._id });
    if (!newUser) return false;
    return true;
  } catch (error) {
    console.log("error while creating user in testing", error);
    return false;
  }
};

export { afterTestFunction, beforeTestFunction, createUserWithOutAuthorizing };
