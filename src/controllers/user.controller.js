import { isValidObjectId } from "mongoose";
import { Auth } from "../models/auth.model.js";
import { Role } from "../models/role.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CustomError } from "../utils/customError.js";

// create user
// ---------
const createUser = asyncHandler(async (req, res, next) => {
  if (!req?.body) return next(new CustomError(400, "Please Provide all fields"));
  const { firstName, lastName, email, password, role } = req.body;
  if (!firstName || !lastName || !email || !password || !role)
    return next(new CustomError(400, "Please Provide all fields"));
  const [user, roleExist] = await Promise.all([Auth.findOne({ email }), Role.findOne({ name: role })]);
  if (user?._id) return next(new CustomError(403, "Email Already Exists"));
  if (!roleExist) return next(new CustomError(404, `Role ${role} Not Exist Please create First`));
  const newUser = await Auth.create({ firstName, lastName, email, password, role: roleExist?._id });
  if (!newUser) return next(new CustomError(400, "Error While Creating User"));
  res.status(201).json({ success: true, message: "User Created Successfully" });
});

// get all users
// ------------
const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await Auth.find();
  if (!users?.length) return next(new CustomError(400, "No Users Found"));
  return res.status(200).json({ success: true, data: users });
});

//get single user
// --------------
const getSingleUser = asyncHandler(async (req, res, next) => {
  const userId = req?.params?.userId;
  if (!isValidObjectId(userId)) return next(new CustomError(400, "Invalid User Id"));
  const user = await Auth.findById(userId);
  if (!user) return next(new CustomError(400, "User Not Found"));
  return res.status(200).json({ success: true, data: user });
});

// update single user
// ------------------
const updateSingleUser = asyncHandler(async (req, res, next) => {
  const userId = req?.params?.userId;
  if (!isValidObjectId(userId)) return next(new CustomError(400, "Invalid User Id"));
  const user = await Auth.findById(userId);
  if (!user) return next(new CustomError(400, "User Not Found"));
  if (!req?.body) return next(new CustomError(400, "Please Provide at least one field"));
  const { firstName, lastName, email, password, role } = req.body;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (email) user.email = email;
  if (password) user.password = password;
  if (role) {
    const roleExist = await Role.findOne({ name: role });
    if (!roleExist) return next(new CustomError(404, `Role ${role} Not Exist Please create First`));
    user.role = roleExist?._id;
  }
  await user.save();
  return res.status(200).json({ success: true, message: "User Updated Successfully" });
});

// delete single user
// ------------------
const deleteSingleUser = asyncHandler(async (req, res, next) => {
  const userId = req?.params?.userId;
  if (!isValidObjectId(userId)) return next(new CustomError(400, "Invalid User Id"));
  const user = await Auth.findByIdAndDelete(userId);
  if (!user) return next(new CustomError(400, "User Not Found"));
  return res.status(200).json({ success: true, message: "User Deleted Successfully" });
});

export { createUser, getAllUsers, getSingleUser, updateSingleUser, deleteSingleUser };
