import request from "supertest";
import app from "../../app.js";
import { getEnv } from "../../configs/config.js";
import { Auth } from "../../models/auth.model.js";
import { getAllRoles, loginRoute } from "../../utils/applicationRoutes.js";
import { createUserWithAdminRoleWithAllPermissions } from "../../utils/jestUtils.js";

const getAllRolesTests = ({ adminRole }, adminUserForTest, guestUserForTest) => {
  let loginAgent;
  // return 401 if user not logged in
  // --------------------------------------------------------
  it("should return 401 if user not logged in ", async () => {
    const res = await request(app).get(getAllRoles);
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
    const roleRes = await guestLogin.get(getAllRoles);
    expect(roleRes.statusCode).toBe(403);
    expect(roleRes.body.message).toBe("You are not authorized to perform this action");
  });
  // logged in with admin user which have all permissions
  // ----------------------------------------------------
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
  // get all roles successfully
  // ---------------------------
  it("should return 200 and return role", async () => {
    const res = await loginAgent.get(getAllRoles);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
};

export { getAllRolesTests };
