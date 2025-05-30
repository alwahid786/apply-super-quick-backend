import { Permission } from "../global/schemas/permission.model.js";

const webPermissions = Object.freeze({
  // user
  create_user: "create_user",
  update_user: "update_user",
  delete_user: "delete_user",
  read_user: "read_user",
  // role
  create_role: "create_role",
  update_role: "update_role",
  delete_role: "delete_role",
  read_role: "read_role",
  // form
  create_form: "create_form",
  delete_form: "delete_form",
  read_form: "read_form",
  submit_form: "submit_form",
});

const addPermissionsIntoDB = async () => {
  const permissionIds = { read: [], create: [], delete: [], update: [] };
  const allPermissions = Object.values(webPermissions);
  const operations = allPermissions.map(async (permission) => {
    const exists = await Permission.findOne({ name: permission });
    if (exists?._id) {
      if (permission.includes("read")) permissionIds.read.push(exists?._id);
      if (permission.includes("create")) permissionIds.create.push(exists?._id);
      if (permission.includes("delete")) permissionIds.delete.push(exists?._id);
      if (permission.includes("update")) permissionIds.update.push(exists?._id);
    }
    // console.log("permission exists:", exists?.name);
    if (!exists) {
      const newPermission = await Permission.create({ name: permission });
      // console.log("Permission created:", newPermission?.name);
      if (permission.includes("read")) permissionIds.read.push(newPermission?._id);
      if (permission.includes("create")) permissionIds.create.push(newPermission?._id);
      if (permission.includes("delete")) permissionIds.delete.push(newPermission?._id);
      if (permission.includes("update")) permissionIds.update.push(newPermission?._id);
    }
    return null;
  });
  const results = await Promise.all(operations);
  if (results?.length === allPermissions?.length) return permissionIds;
};

export { webPermissions, addPermissionsIntoDB };
