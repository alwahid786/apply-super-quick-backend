import request from "supertest";
import app from "../../app.js";
import { createRoleRoute } from "../../utils/applicationRoutes.js";

const createRoleTests = ({ name, permissions }) => {
  // if fields are missing
  // -------------------
  it("should return 400 if fields are missing in role", async () => {
    const res = await request(app).post(createRoleRoute).send({ name });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Please Provide role name and permissions");
  });
  // if permissions is not an array
  it("should return 400 if permissions is not an array", async () => {
    const res = await request(app).post(createRoleRoute).send({ name, permissions: "string" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Permissions should be an array");
  });
};

export { createRoleTests };
