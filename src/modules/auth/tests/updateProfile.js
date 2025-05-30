import request from "supertest";
import app from "../../../app.js";
import { getEnv } from "../../../configs/config.js";
import { loginRoute, updateMyProfileRoute } from "../../../global/lib/applicationRoutes.js";
import { Role } from "../../role/schemas/role.model.js";
import { allPermissions } from "../../../global/tests/jest.utils.js";
import { Auth } from "../../auth/schemas/auth.model.js";

const updateMyProfileTests = ({ firstName, lastName, role, email, password }, adminUserForTest) => {
  let loginAgent;
  // if user not logged in
  // ---------------------
  it("should return 401 if user not logged in", async () => {
    const res = await request(app).put(updateMyProfileRoute);
    expect(res?.statusCode).toBe(401);
    expect(res?.body?.message).toBe("Please Login First");
  });

  // create user for update profile and login from his profile
  // ---------------------
  it("should return 200 if user logged in", async () => {
    loginAgent = request.agent(app);
    const [isExistUser, isExistRole] = await Promise.all([Auth.findOne({ email }), Role.findOne({ name: role })]);
    if (!isExistRole) await Role.create({ name: role, permissions: allPermissions.read });
    if (!isExistUser) {
      const { email: adminEmail, password: adminPass } = adminUserForTest;
      const res = await loginAgent.post(loginRoute).send({ email: adminEmail, password: adminPass });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Logged In Successfully");
      const resCreate = await loginAgent.post(createUserRoute).send({ firstName, lastName, role, email, password });
      expect(resCreate.statusCode).toBe(201);
      expect(resCreate.body.message).toBe("User Created Successfully");
    }
    const loginRes = await loginAgent.post(loginRoute).send({ email, password });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.message).toBe("Logged In Successfully");
    expect(loginRes.headers["set-cookie"]).toBeDefined();
    const setCookie = loginRes.headers["set-cookie"];
    expect(setCookie).toHaveLength(2);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("ACCESS_TOKEN_NAME")}=`))).toBe(true);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("REFRESH_TOKEN_NAME")}=`))).toBe(true);
  });

  // if user updated successfully
  // ---------------------
  it("should return 200 if user logged in", async () => {
    const res = await loginAgent.put(updateMyProfileRoute).send({ firstName, lastName });
    expect(res?.statusCode).toBe(200);
    expect(res?.body?.message).toBe("Profile Updated Successfully");
  });
};

export { updateMyProfileTests };
