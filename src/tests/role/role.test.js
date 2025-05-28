import { adminUserForTest, guestUerForTest } from "../globalDataForJest.js";
import { createRoleTests } from "./createRole.js";
import { RoleTestData } from "./role.data.js";

describe("Role Tests - Create Role", () => createRoleTests(RoleTestData, adminUserForTest, guestUerForTest));
