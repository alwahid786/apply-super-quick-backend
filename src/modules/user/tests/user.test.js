import { adminUserForTest, guestUserForTest } from "../../../global/tests/jest.data.js";
import { createUserTests } from "./createUser.js";
import { createUserData } from "./user.data.js";

describe("User Tests - Create User", () => createUserTests(createUserData, adminUserForTest, guestUserForTest));
