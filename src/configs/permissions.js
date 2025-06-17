import { Permission } from "../global/schemas/permission.model.js";
import { Role } from "../modules/role/schemas/role.model.js";

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
  // branding
  create_branding: "create_branding",
  update_branding: "update_branding",
  delete_branding: "delete_branding",
  read_branding: "read_branding",
});

const addPermissionsIntoDB = async () => {
  const permissionIds = { read: [], create: [], delete: [], update: [], other: [] };
  const allPermissions = Object.values(webPermissions);
  const operations = allPermissions.map(async (permission) => {
    const exists = await Permission.findOne({ name: permission });
    if (exists?._id) {
      if (permission.includes("read")) permissionIds.read.push(exists?._id);
      else if (permission.includes("create")) permissionIds.create.push(exists?._id);
      else if (permission.includes("delete")) permissionIds.delete.push(exists?._id);
      else if (permission.includes("update")) permissionIds.update.push(exists?._id);
      else permissionIds.other.push(exists?._id);
    }
    // console.log("permission exists:", exists?.name);
    if (!exists) {
      const newPermission = await Permission.create({ name: permission });
      // console.log("Permission created:", newPermission?.name);
      if (permission.includes("read")) permissionIds.read.push(newPermission?._id);
      else if (permission.includes("create")) permissionIds.create.push(newPermission?._id);
      else if (permission.includes("delete")) permissionIds.delete.push(newPermission?._id);
      else if (permission.includes("update")) permissionIds.update.push(newPermission?._id);
      else permissionIds.other.push(exists?._id);
    }
    return null;
  });
  const results = await Promise.all(operations);
  // add all permission ids in admin role
  await Role.findByIdAndUpdate("683060994ab928b3b6a697e6", {
    permissions: [
      ...permissionIds.read,
      ...permissionIds.create,
      ...permissionIds.delete,
      ...permissionIds.update,
      ...permissionIds.other,
    ],
  });
  if (results?.length === allPermissions?.length) return permissionIds;
};

export { webPermissions, addPermissionsIntoDB };
