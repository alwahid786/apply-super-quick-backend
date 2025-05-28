import { adminUserForTest } from "../globalDataForJest.js";
import { authTestData } from "./auth.data.js";
import { getMyProfileTests } from "./getMyProfile.js";
import { loginTests } from "./login.js";
import { logoutTests } from "./logout.js";
import { updateMyProfileTests } from "./updateProfile.js";

describe("Auth Tests - Login User", () => loginTests(authTestData, adminUserForTest));
describe("Auth Tests - Logout User", () => logoutTests(adminUserForTest));
describe("Auth Tests - Get My Profile", () => getMyProfileTests(adminUserForTest));
describe("Auth Tests - Update My Profile", () => updateMyProfileTests(authTestData, adminUserForTest));
