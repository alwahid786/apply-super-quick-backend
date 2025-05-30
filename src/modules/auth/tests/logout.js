import request from "supertest";
import app from "../../../app.js";
import { getEnv } from "../../../configs/config.js";
import { loginRoute, logoutRoute } from "../../../global/lib/applicationRoutes.js";

const logoutTests = ({ email, password }) => {
  let loginAgent;
  // first login user so we can logout him and clear cookies
  // ------------------------------------------------------
  it("should return 200 and logged in user", async () => {
    loginAgent = request.agent(app);
    // login user and check response
    let res = await loginAgent.post(loginRoute).send({ email, password });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged In Successfully");
    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toHaveLength(2);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("ACCESS_TOKEN_NAME")}=`))).toBe(true);
    expect(setCookie.some((c) => c.startsWith(`${getEnv("REFRESH_TOKEN_NAME")}=`))).toBe(true);
  });

  // logout and clear cookies
  // -----------------------
  it("logout and clears cookies", async () => {
    const logoutRes = await loginAgent.get(logoutRoute);
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
