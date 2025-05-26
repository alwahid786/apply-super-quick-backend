import request from "supertest";
import app from "../../app.js";
import { getMyProfileRoute, loginRoute, logoutRoute } from "../../utils/applicationRoutes.js";
import { getEnv } from "../../configs/config.js";

const getMyProfileTests = ({ firstName, lastName, email, password }) => {
  // if user not logged in
  // ---------------------
  it("should return 401 if user not logged in", async () => {
    const res = await request(app).get(getMyProfileRoute);
    expect(res?.statusCode).toBe(401);
    expect(res?.body?.message).toBe("Please Login First");
  });

  // if user logged in
  // ---------------------
  it("should return 200 if user logged in", async () => {
    let loginAgent = request.agent(app);
    const loginRes = await loginAgent.post(loginRoute).send({ email, password });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.message).toBe("Logged In Successfully");
    expect(loginRes.headers["set-cookie"]).toBeDefined();
    const setCookie = loginRes.headers["set-cookie"];
    expect(setCookie).toHaveLength(2);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("ACCESS_TOKEN_NAME")}=`))).toBe(true);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("REFRESH_TOKEN_NAME")}=`))).toBe(true);
    const res = await loginAgent.get(getMyProfileRoute);
    expect(res?.statusCode).toBe(200);
    expect(res?.body?.data?.firstName).toBe(firstName);
    expect(res?.body?.data?.lastName).toBe(lastName);
    expect(res?.body?.data?.email).toBe(email);
    // then logout him
    const logoutRes = await loginAgent.get(logoutRoute);
    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.body.message).toBe("Logged Out Successfully");
  });
};

export { getMyProfileTests };
