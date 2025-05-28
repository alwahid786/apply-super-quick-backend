import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { getEnv } from "../configs/config.js";
import { addPermissionsIntoDB } from "../configs/permissions.js";
import { Auth } from "../models/auth.model.js";
import { Role } from "../models/role.model.js";
import { adminUserForTest, guestUserForTest } from "../tests/globalDataForJest.js";

let allPermissions = { create: [], delete: [], read: [], update: [] };
let mongoServer;

// before we start testing testing
const beforeTestFunction = async () => {
  try {
    process.env.NODE_ENV = "test";
    await mongoose.disconnect();
    mongoServer = await MongoMemoryServer.create();
    const testDbName = getEnv("MONGODB_NAME")?.concat("-test");
    const mongoUrl = mongoServer.getUri();
    const res = await mongoose.connect(mongoUrl, { dbName: testDbName });
    if (!res.connection.readyState === 1) return console.error("BEFORE TEST :Failed to connect to DB");
    if (mongoose?.connection?.db?.databaseName == testDbName)
      console.log(`BEFORE TEST :${res?.connection?.db?.databaseName} connected successfully`);
    allPermissions = await addPermissionsIntoDB();
    adminUserForTest.permissions = [
      ...allPermissions?.read,
      ...allPermissions?.create,
      ...allPermissions?.delete,
      ...allPermissions?.update,
    ];
    const [adminUser, guestUser] = await Promise.all([
      createUserWithAdminRoleWithAllPermissions(adminUserForTest),
      createUserWithAdminRoleWithAllPermissions(guestUserForTest),
    ]);
    if (!adminUser) throw new Error("Error While Creating adminUser");
    if (!guestUser) throw new Error("Error While Creating guestUser");
  } catch (error) {
    console.log("BEFORE TEST :Failed to complete before all func in testing:", error);
  }
};
// after we start testing testing
const afterTestFunction = async () => {
  try {
    const dbName = mongoose?.connection?.db?.databaseName;
    const testDbName = getEnv("MONGODB_NAME")?.concat("-test");
    if (dbName == testDbName) {
      await mongoose.disconnect();
      await mongoServer.stop();
      console.log(`AFTER TEST : ${dbName} connection closed successfully`);
    }
  } catch (error) {
    console.log("AFTER TEST :Failed to complete after all func in testing:", error);
  }
};

// create a sample user for testing before we start testing
const createUserWithAdminRoleWithAllPermissions = async ({
  firstName,
  lastName,
  email,
  password,
  role,
  permissions,
}) => {
  try {
    let roleId;
    if (!firstName || !lastName || !email || !password || !role || !permissions) return false;
    // check user and role exist or not
    const [isUserExist, isRoleExist] = await Promise.all([Auth.findOne({ email }), Role.findOne({ name: role })]);
    if (isUserExist) throw new Error("Email Already Exists");
    // if role not exist then create role and save id
    if (!isRoleExist) {
      const createRole = await Role.create({ name: role, permissions });
      if (!createRole) throw new Error("Error While Creating Role");
      roleId = createRole?._id;
    } else roleId = isRoleExist?._id;
    // then create a new user admin with all permissions
    const user = await Auth.create({ firstName, lastName, email, password, role: roleId });
    if (!user) throw new Error("Error While Creating User");
    return user;
  } catch (error) {
    console.log("error while creating user in testing", error);
    return false;
  }
};

export { afterTestFunction, allPermissions, beforeTestFunction, createUserWithAdminRoleWithAllPermissions };
