import request from "supertest";
import app from "../../app.js";
import { getEnv } from "../../configs/config.js";
import { loginRoute, updateMyProfileRoute } from "../../utils/applicationRoutes.js";

const updateMyProfileTests = ({ firstName, lastName, email, password }) => {
  let loginAgent;
  // if user not logged in
  // ---------------------
  it("should return 401 if user not logged in", async () => {
    const res = await request(app).put(updateMyProfileRoute);
    expect(res?.statusCode).toBe(401);
    expect(res?.body?.message).toBe("Please Login First");
  });

  //  login user for update profile
  // ---------------------
  it("should return 200 if user logged in", async () => {
    loginAgent = request.agent(app);
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
