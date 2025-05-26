import { isValidObjectId } from "mongoose";
import { Permission } from "../models/permission.model.js";
import { Role } from "../models/role.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CustomError } from "../utils/customError.js";

// create new role
// ----------------
const createRole = asyncHandler(async (req, res, next) => {
  if (!req?.body) return next(new CustomError(400, "Please Provide all fields"));
  let { name, permissions } = req.body;
  if (!name || !permissions?.length) return next(new CustomError(400, "Please Provide role name and permissions"));
  if (!Array.isArray(permissions)) return next(new CustomError(400, "Permissions should be an array"));
  // remove dublicate
  permissions = [...new Set(permissions.map((permission) => String(permission)))];
  permissions.forEach((permission) => {
    if (!isValidObjectId(permission)) return next(new CustomError(400, "Invalid Id detected in permissions"));
  });
  const [isRoleExist, isPermissionsExist] = await Promise.all([
    Role.findOne({ name }),
    Permission.find({ _id: { $in: permissions } }),
  ]);
  if (isRoleExist) return next(new CustomError(400, "Role Already Exists"));
  if (isPermissionsExist?.length !== permissions?.length)
    return next(new CustomError(400, "Invalid Id detected in permissions"));
  const newRole = await Role.create({ name, permissions });
  if (!newRole) return next(new CustomError(400, "Error While Creating Role"));
  return res.status(201).json({ success: true, message: "Role Created Successfully" });
});

// get all roles
// ------------
const getAllRoles = asyncHandler(async (req, res, next) => {
  const roles = await Role.find().select(["_id", "name"]);
  if (!roles?.length) return next(new CustomError(400, "No Roles Found"));
  return res.status(200).json({ success: true, data: roles });
});

//get single role
// --------------
const getSingleRole = asyncHandler(async (req, res, next) => {
  const roleId = req?.params?.roleId;
  if (!isValidObjectId(roleId)) return next(new CustomError(400, "Invalid Role Id"));
  const role = await Role.findById(roleId);
  if (!role) return next(new CustomError(400, "Role Not Found"));
  return res.status(200).json({ success: true, data: role });
});

// update single role
// ------------------
const updateSingleRole = asyncHandler(async (req, res, next) => {
  const roleId = req?.params?.roleId;
  if (!isValidObjectId(roleId)) return next(new CustomError(400, "Invalid Role Id"));
  if (!req?.body) return next(new CustomError(400, "Please Provide At Least One Field"));
  let { name, permissions } = req.body;
  if (!name && !permissions?.length) return next(new CustomError(400, "Please Provide At Least One Field"));
  const role = await Role.findById(roleId);
  if (!role) return next(new CustomError(400, "Role Not Found"));

  if (name) role.name = name;
  if (permissions) {
    // remove dublicate and validate
    permissions = [...new Set(permissions?.map((permission) => String(permission)))];
    permissions.forEach((permission) => {
      if (!isValidObjectId(permission)) return next(new CustomError(400, "Invalid Id detected in permissions"));
    });
    const isPermissionsExist = await Permission.find({ _id: { $in: permissions } });
    if (isPermissionsExist?.length !== permissions?.length)
      return next(new CustomError(400, "Invalid Id detected in permissions"));
    role.permissions = permissions;
  }
  const updatedRole = await role.save();
  if (!updatedRole) return next(new CustomError(400, "Error While Updating Role"));
  return res.status(200).json({ success: true, message: "Role Updated Successfully" });
});

// delete single role
// ------------------
const deleteSingleRole = asyncHandler(async (req, res, next) => {
  const roleId = req?.params?.roleId;
  if (!isValidObjectId(roleId)) return next(new CustomError(400, "Invalid Role Id"));
  const role = await Role.findByIdAndDelete(roleId);
  if (!role) return next(new CustomError(400, "Role Not Found"));
  return res.status(200).json({ success: true, message: "Role Deleted Successfully" });
});

export { createRole, getAllRoles, getSingleRole, updateSingleRole, deleteSingleRole };
