import request from "supertest";
import app from "../../app.js";
import { Auth } from "../../models/auth.model.js";
import { getEnv } from "../../configs/config.js";
import { createUserRoute, loginRoute, logoutRoute } from "../../utils/applicationRoutes.js";

const logoutTests = ({ firstName, lastName, email, password }) => {
  let customAgent;
  // check is user registered then login him else register him before testing this test case
  // ---------------------------------------------------------------------------------------
  beforeAll(async () => {
    customAgent = request.agent(app);
    let regRes;
    const isExist = await Auth.exists({ email });
    if (!isExist) {
      // register user and check response
      regRes = await customAgent.post(createUserRoute).send({ firstName, lastName, email, password });
      expect(regRes.statusCode).toBe(201);
      expect(regRes.body.message).toBe("Your Account Registered Successfully");
    }
    // login user and check response
    let logRes = await customAgent.post(loginRoute).send({ email, password });
    expect(logRes.statusCode).toBe(200);
    expect(logRes.body.message).toBe("Logged In Successfully");

    // check is cookies exist in response
    expect(logRes.headers["set-cookie"]).toBeDefined();
    const setCookie = logRes.headers["set-cookie"];
    expect(setCookie).toHaveLength(2);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("ACCESS_TOKEN_NAME")}=`))).toBe(true);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("REFRESH_TOKEN_NAME")}=`))).toBe(true);
  });

  // logout and clear cookies
  // -----------------------
  it("logout and clears cookies", async () => {
    const logoutRes = await customAgent.get(logoutRoute);
    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.body.message).toBe("Logged Out Successfully");
    const cookies = logoutRes.headers["set-cookie"];
    expect(cookies).toHaveLength(2);
    const at = cookies.find((c) => c.startsWith(getEnv("ACCESS_TOKEN_NAME")));
    const rt = cookies.find((c) => c.startsWith(getEnv("REFRESH_TOKEN_NAME")));
    expect(at).toMatch(/Max-Age=0/);
    expect(rt).toMatch(/Max-Age=0/);
  });

  // if cookies not exist
  // --------------------
  it("rejects unauthenticated logout", async () => {
    const unauth = request.agent(app);
    const res = await unauth.get(logoutRoute);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Please Login First");
  });
};

export { logoutTests };
