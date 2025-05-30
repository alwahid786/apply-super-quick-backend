import request from "supertest";
import app from "../../../app.js";
import { getEnv } from "../../../configs/config.js";
import { createUserRoute, loginRoute } from "../../../global/lib/applicationRoutes.js";
import { Role } from "../../role/schemas/role.model.js";
import { allPermissions } from "../../../global/tests/jest.utils.js";
import { Auth } from "../../auth/schemas/auth.model.js";

const loginTests = ({ firstName, lastName, email, password, role, wrongEmail, wrongPassword }, adminUserForTest) => {
  let loginAgent;
  // if password is missing
  // -------------------
  it("should return 400 if password is missing", async () => {
    const res = await request(app).post(loginRoute).send({ email });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Please Provide Email and Password");
  });
  // if email is missing
  // -------------------
  it("should return 400 if email id missing", async () => {
    const res = await request(app).post(loginRoute).send({ password });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Please Provide Email and Password");
  });
  // if email is wrong
  // -------------------
  it("should return 404 if email is incorrect", async () => {
    const existing = await Auth.findOne({ email });
    if (!existing) await request(app).post(createUserRoute).send({ firstName, lastName, role, email, password });
    const res = await request(app).post(loginRoute).send({ email: wrongEmail, password });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Wrong email or password");
  });
  // if password is wrong
  // -------------------
  it("should return 404 if password is incorrect", async () => {
    const existing = await Auth.findOne({ email });
    if (!existing) await request(app).post(createUserRoute).send({ firstName, lastName, role, email, password });
    const res = await request(app).post(loginRoute).send({ email, password: wrongPassword });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Wrong email or password");
  });
  // if login is successful
  // -------------------
  it("should login user successfully", async () => {
    const [isExistUser, isExistRole] = await Promise.all([Auth.findOne({ email }), Role.findOne({ name: role })]);
    if (!isExistRole) await Role.create({ name: role, permissions: allPermissions.read });
    if (!isExistUser) {
      loginAgent = request.agent(app);
      const { email: adminEmail, password: adminPass } = adminUserForTest;
      const res = await loginAgent.post(loginRoute).send({ email: adminEmail, password: adminPass });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Logged In Successfully");
      const resCreate = await loginAgent.post(createUserRoute).send({ firstName, lastName, role, email, password });
      expect(resCreate.statusCode).toBe(201);
      expect(resCreate.body.message).toBe("User Created Successfully");
    }
    const res = await loginAgent.post(loginRoute).send({ email, password });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged In Successfully");
    expect(res.headers["set-cookie"]).toBeDefined();
    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toHaveLength(2);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("ACCESS_TOKEN_NAME")}=`))).toBe(true);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("REFRESH_TOKEN_NAME")}=`))).toBe(true);
  });
};

export { loginTests };
