import { addPermissionsIntoDB } from "../../configs/permissions.js";
import { createRoleTests } from "./createRole.js";

const createRoleData = {
  adminRole: "admin",
  userRole: "user",
};

const permissions = addPermissionsIntoDB();
createRoleData.permissions = permissions;

describe("Role Tests - Create Role", () => createRoleTests(createRoleData));
