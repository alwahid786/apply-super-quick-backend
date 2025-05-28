import { adminUserForTest, guestUserForTest } from "../globalDataForJest.js";
import { createUserTests } from "./createUser.js";
import { createUserData } from "./user.data.js";

describe("User Tests - Create User", () => createUserTests(createUserData, adminUserForTest, guestUserForTest));
