import { adminUserForTest } from "../globalDataForJest.js";
import { authTestData } from "./auth.data.js";
import { loginTests } from "./login.js";

describe("Auth Tests - Login User", () => loginTests(authTestData, adminUserForTest));
// describe("Auth Tests - Logout User", () => logoutTests(authTestData, guestUserForTest));
