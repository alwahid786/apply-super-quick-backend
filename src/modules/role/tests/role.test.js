import { adminUserForTest, guestUserForTest } from "../../../global/tests/jest.data.js";
import { createRoleTests } from "./createRole.js";
import { getAllRolesTests } from "./getAllRoles.js";
import { getSingleRoleTests } from "./getSingleRole.js";
import { RoleTestData } from "./role.data.js";

describe("Role Tests - Create Role", () => createRoleTests(RoleTestData, adminUserForTest, guestUserForTest));
describe("Role Tests - Get All", () => getAllRolesTests(RoleTestData, adminUserForTest, guestUserForTest));
describe("Role Tests - Get Single Role", () => getSingleRoleTests(RoleTestData, adminUserForTest, guestUserForTest));
