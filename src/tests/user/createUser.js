import request from "supertest";
import app from "../../app.js";
import { Auth } from "../../models/auth.model.js";
import { createUserRoute } from "../../utils/applicationRoutes.js";

const createUserTests = ({ firstName, lastName, email, role, password }) => {
  // if fields are missing
  // -------------------
  // it("should return 400 if fields are missing", async () => {
  //   const res = await request(app).post(createUserRoute).send({ email });
  //   expect(res.statusCode).toBe(400);
  //   expect(res.body.message).toBe("Please Provide all fields");
  // });
  // // if email already exists
  // // -----------------------
  // it("should return 403 if email already exists", async () => {
  //   let user = await Auth.findOne({ email });
  //   if (!user) user = await request(app).post(createUserRoute).send({ firstName, lastName, role, email, password });
  //   const res = await request(app).post(createUserRoute).send({ firstName, lastName, email, role, password });
  //   console.log("res", res.body);
  //   expect(res.statusCode).toBe(403);
  //   expect(res.body.message).toBe("Email Already Exists");
  // });
  // // if user creation fails
  // // ----------------------
  // it("should return 400 if user creation fails (simulate DB failure)", async () => {
  //   const originalCreate = Auth.create;
  //   Auth.create = () => Promise.resolve(null);
  //   const res = await request(app).post(createUserRoute).send({ firstName, lastName, email, password, role });
  //   expect(res.statusCode).toBe(400);
  //   expect(res.body.message).toBe("Error While Creating User");
  //   Auth.create = originalCreate;
  // });
  // // register user successfully
  // // --------------------------
  // it("should create user successfully ", async () => {
  //   const existing = await Auth.findOne({ email });
  //   if (existing) await Auth.findByIdAndDelete(existing?._id);
  //   const res = await request(app).post(createUserRoute).send({ firstName, lastName, email, password, role });
  //   expect(res.statusCode).toBe(201);
  //   expect(res.body.message).toBe("User Created Successfully");
  //   const userInDb = await Auth.findOne({ email });
  //   expect(userInDb).not.toBeNull();
  //   expect(userInDb.firstName).toBe(firstName);
  // });
};

export { createUserTests };
