export default {
  setupFilesAfterEnv: ["./src/global/tests/jest.setup.js"],
  testMatch: [
    "**/src/modules/role/tests/role.test.js",
    "**/src/modules/user/tests/user.test.js",
    "**/src/modules/auth/tests/auth.test.js",
  ],
};
