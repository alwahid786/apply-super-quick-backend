export default {
  // globalTeardown: "./src/tests/global/globalTearDown.js",
  // globalSetup: "./src/tests/global/globalSetup.js",
  setupFilesAfterEnv: ["./src/tests/global/jest.setup.js"],
  testMatch: ["**/tests/role/role.test.js", "**/tests/user/user.test.js", "**/tests/auth/auth.test.js"],
};
