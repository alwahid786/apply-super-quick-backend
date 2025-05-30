import request from "supertest";
import app from "../../../app.js";
import { getEnv } from "../../../configs/config.js";
import { createRoleRoute, loginRoute } from "../../../global/lib/applicationRoutes.js";
import { Auth } from "../../auth/schemas/auth.model.js";
import { allPermissions, createUserWithAdminRoleWithAllPermissions } from "../../../global/tests/jest.utils.js";

const createRoleTests = ({ readRole, adminRole }, adminUserForTest, guestUserForTest) => {
  let loginAgent;
  // return 401 if user not logged in
  // --------------------------------------------------------
  it("should return 401 if user not logged in ", async () => {
    const res = await request(app).post(createRoleRoute).send({ name: readRole, permissions: allPermissions.read });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Please Login First");
  });
  // return 403 not authorized if user don,t have permissions
  // --------------------------------------------------------
  it("should return 403 if user don,t have permissions ", async () => {
    const { email, password } = guestUserForTest;
    let guestLogin = request.agent(app);
    const existing = await Auth.findOne({ email });
    if (!existing) await createUserWithAdminRoleWithAllPermissions(guestUserForTest);
    const res = await guestLogin.post(loginRoute).send({ email, password });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged In Successfully");
    expect(res.headers["set-cookie"]).toBeDefined();
    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toHaveLength(2);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("ACCESS_TOKEN_NAME")}=`))).toBe(true);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("REFRESH_TOKEN_NAME")}=`))).toBe(true);
    const roleRes = await guestLogin.post(createRoleRoute).send({ name: readRole, permissions: allPermissions.read });
    expect(roleRes.statusCode).toBe(403);
    expect(roleRes.body.message).toBe("You are not authorized to perform this action");
  });
  // logged in with admin user which have all permissions
  // --------------------------------------------------------
  it("should return 200 logged in with admin user ", async () => {
    const { email, password } = adminUserForTest;
    loginAgent = request.agent(app);
    const existing = await Auth.findOne({ email });
    if (!existing) await createUserWithAdminRoleWithAllPermissions(adminUserForTest);
    const res = await loginAgent.post(loginRoute).send({ email, password });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged In Successfully");
    expect(res.headers["set-cookie"]).toBeDefined();
    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toHaveLength(2);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("ACCESS_TOKEN_NAME")}=`))).toBe(true);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("REFRESH_TOKEN_NAME")}=`))).toBe(true);
  });
  // if fields are missing
  // -------------------
  it("should return 400 if fields are missing in role", async () => {
    const res = await loginAgent.post(createRoleRoute).send({ name: readRole });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Please Provide role name and permissions");
  });
  // if permissions is not an array
  // -----------------------------
  it("should return 400 if permissions is not an array", async () => {
    const res = await loginAgent.post(createRoleRoute).send({ name: readRole, permissions: "string" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Permissions should be an array");
  });
  // if permissions are invalid
  // --------------------------
  it("should return 400 if any permission id is invalid", async () => {
    const res = await loginAgent.post(createRoleRoute).send({ name: readRole, permissions: ["invalidId"] });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid Id detected in permissions");
  });
  // if role already exist
  // ---------------------
  it("should return 400 if role already exist", async () => {
    const res = await loginAgent.post(createRoleRoute).send({ name: adminRole, permissions: allPermissions?.create });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Role Already Exists");
  });
  // create new role successfully
  // ---------------------------
  it("should return 201 if role is created successfully", async () => {
    const res = await loginAgent.post(createRoleRoute).send({ name: readRole, permissions: allPermissions?.read });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Role Created Successfully");
  });
};

export { createRoleTests };
