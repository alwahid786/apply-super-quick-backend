import { Permission } from "../models/permission.model.js";

const webPermissions = Object.freeze({
  create_user: "create_user",
  update_user: "update_user",
  delete_user: "delete_user",
  read_user: "read_user",
  create_role: "create_role",
  update_role: "update_role",
  delete_role: "delete_role",
  read_role: "read_role",
});

const addPermissionsIntoDB = async () => {
  const permissionIds = [];
  const allPermissions = Object.values(webPermissions);
  const operations = allPermissions.map(async (permission) => {
    const exists = await Permission.findOne({ name: permission });
    if (exists?._id) permissionIds.push(exists?._id);
    // console.log("permission exists:", exists?.name);
    if (!exists) {
      const newPermission = await Permission.create({ name: permission });
      if (newPermission?._id) permissionIds.push(newPermission?._id);
      // console.log("Permission created:", newPermission?.name);
    }
    return null;
  });
  const results = await Promise.all(operations);
  return permissionIds;
};

export { webPermissions, addPermissionsIntoDB };
