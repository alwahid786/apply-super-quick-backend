import request from "supertest";
import app from "../../app.js";
import { getEnv } from "../../configs/config.js";
import { Auth } from "../../models/auth.model.js";
import { Role } from "../../models/role.model.js";
import { createUserRoute, loginRoute } from "../../utils/applicationRoutes.js";
import { allPermissions } from "../../utils/jestUtils.js";

const createUserTests = ({ firstName, lastName, email, role, password }, adminUserForTest, guestUserForTest) => {
  let loggedInAgent;
  // return 401 if user not logged in
  // --------------------------------
  it("should return 401 if user not logged in ", async () => {
    const res = await request(app).post(createUserRoute).send({ firstName, lastName, email, role, password });
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

    const roleRes = await guestLogin.post(createUserRoute).send({ firstName, lastName, email, role, password });
    expect(roleRes.statusCode).toBe(403);
    expect(roleRes.body.message).toBe("You are not authorized to perform this action");
  });
  // logged in with admin user which have all permissions
  // --------------------------------------------------------
  it("should return 200 logged in with admin user ", async () => {
    const { email, password } = adminUserForTest;
    loggedInAgent = request.agent(app);
    const existing = await Auth.findOne({ email });
    if (!existing) await createUserWithAdminRoleWithAllPermissions(adminUserForTest);
    const res = await loggedInAgent.post(loginRoute).send({ email, password });
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
  it("should return 400 if fields are missing", async () => {
    const res = await loggedInAgent.post(createUserRoute).send({ email });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Please Provide all fields");
  });
  // if role not exist
  // -----------------
  it("should return 403 if email already exists", async () => {
    const isExistRole = await Role.findOne({ name: role });
    if (isExistRole) await Role.findByIdAndDelete(isExistRole?._id);
    const res = await loggedInAgent.post(createUserRoute).send({ firstName, lastName, email, role, password });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe(`Role ${role} Not Exist Please create First`);
  });
  // if register user successfully
  // -----------------------------
  it("should create user successfully ", async () => {
    const [isExistUser, isExistRole] = await Promise.all([Auth.findOne({ email }), Role.findOne({ name: role })]);
    if (!isExistRole) await Role.create({ name: role, permissions: allPermissions.read });
    if (isExistUser) await Auth.findByIdAndDelete(isExistUser?._id);
    const res = await loggedInAgent.post(createUserRoute).send({ firstName, lastName, email, role, password });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User Created Successfully");
    const userInDb = await Auth.findOne({ email });
    expect(userInDb).not.toBeNull();
    expect(userInDb.firstName).toBe(firstName);
  });
  // if email already exists
  // -----------------------
  it("should return 403 if email already exists", async () => {
    const [isExistUser, isExistRole] = await Promise.all([Auth.findOne({ email }), Role.findOne({ name: role })]);
    if (!isExistRole) await Role.create({ name: role, permissions: allPermissions.read });
    if (!isExistUser) await loggedInAgent.post(createUserRoute).send({ firstName, lastName, role, email, password });
    const res = await loggedInAgent.post(createUserRoute).send({ firstName, lastName, email, role, password });
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Email Already Exists");
  });
};

export { createUserTests };
