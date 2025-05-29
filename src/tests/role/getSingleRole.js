import request from "supertest";
import app from "../../app.js";
import { getEnv } from "../../configs/config.js";
import { Auth } from "../../models/auth.model.js";
import { singleRoleRoute, loginRoute } from "../../utils/applicationRoutes.js";
import { createUserWithAdminRoleWithAllPermissions } from "../../utils/jestUtils.js";

const getSingleRoleTests = ({ adminRole }, adminUserForTest, guestUserForTest) => {
  let loginAgent;
  let endPoint = singleRoleRoute;
  // find admin user role which is already defined in db
  // ----------------------------------------------------
  it("should return admin user role and save it for next use", async () => {
    const { email } = adminUserForTest;
    const admin = await Auth.findOne({ email });
    if (admin?.role) endPoint = `${singleRoleRoute}/${admin?.role}`;
    expect(admin?.email).toBe(email);
  });
  // return 401 if user not logged in
  // --------------------------------------------------------
  it("should return 401 if user not logged in ", async () => {
    const res = await request(app).get(endPoint);
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
    const roleRes = await guestLogin.get(endPoint);
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
  // if invalid params
  // ------------------
  it("should return 400 if role id is invalid", async () => {
    const res = await loginAgent.get(`${singleRoleRoute}/string`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid Role Id");
  });

  // get single role successfully
  // ---------------------------
  it("should return 200 and return role", async () => {
    const res = await loginAgent.get(endPoint);
    expect(res.statusCode).toBe(200);
    expect(res.body.data?.name).toBe(adminRole);
  });
};

export { getSingleRoleTests };
