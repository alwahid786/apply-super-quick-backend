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
  update_form: "update_form",
  customize_form: "customize_form",
  submit_form: "submit_form",
  update_submission: "update_submission",
  id_mission: "id_mission",
  // company lookup
  lookup_company: "lookup_company",
  // create strategy
  create_strategy: "create_strategy",
  update_strategy: "update_strategy",
  delete_strategy: "delete_strategy",
  read_strategy: "read_strategy",
  // prompts
  create_prompt: "create_prompt",
  update_prompt: "update_prompt",
  delete_prompt: "delete_prompt",
  read_prompt: "read_prompt",
  // branding
  create_branding: "create_branding",
  update_branding: "update_branding",
  delete_branding: "delete_branding",
  read_branding: "read_branding",
  fetch_branding: "fetch_branding",
});

const addAllNewPermissionsInDb = async () => {
  const allPermissions = Object.values(webPermissions);
  const operations = allPermissions.map(async (permission) => {
    const exists = await Permission.findOne({ name: permission });
    if (!exists) {
      const newPermission = await Permission.create({ name: permission });
    }
    return null;
  });
  const results = await Promise.all(operations);
  if (results?.length === allPermissions?.length) return true;
};

const addPermissionsInRoles = async () => {
  const {
    // user
    create_user,
    update_user,
    delete_user,
    read_user,
    // role
    create_role,
    update_role,
    delete_role,
    read_role,
    // form
    create_form,
    delete_form,
    read_form,
    update_form,
    customize_form,
    submit_form,
    update_submission,
    id_mission,
    // company lookup
    lookup_company,
    // create strategy
    create_strategy,
    update_strategy,
    delete_strategy,
    read_strategy,
    // prompts
    create_prompt,
    update_prompt,
    delete_prompt,
    read_prompt,
    // branding
    create_branding,
    update_branding,
    delete_branding,
    read_branding,
    fetch_branding,
  } = webPermissions;

  const Roles = ["admin", "guest", "user"];
  const [adminRoleId, guestRoleId, userRoleId] = await Promise.all(
    Roles.map(async (roleName) => {
      const role = await Role.findOneAndUpdate({ name: roleName }, { name: roleName }, { upsert: true, new: true });
      if (!role) return null;
      return role._id;
    })
  );

  const adminPermission = [
    create_user,
    update_user,
    delete_user,
    read_user,
    create_role,
    update_role,
    delete_role,
    read_role,
    create_form,
    delete_form,
    read_form,
    update_form,
    customize_form,
    submit_form,
    update_submission,
    id_mission,
    lookup_company,
    create_strategy,
    update_strategy,
    delete_strategy,
    read_strategy,
    create_prompt,
    update_prompt,
    delete_prompt,
    read_prompt,
    create_branding,
    update_branding,
    delete_branding,
    read_branding,
    fetch_branding,
  ];

  const guestPermissions = [submit_form, read_form, id_mission, update_submission, lookup_company, read_branding];

  const findAdminPermissionIds = await Promise.all(
    adminPermission.map(async (permission) => {
      const permissionId = await Permission.findOne({ name: permission });
      if (!permissionId) console.log("admin Permission Not Exist in Db", permission);
      return permissionId._id;
    })
  );

  await Role.updateOne({ _id: adminRoleId }, { $set: { permissions: findAdminPermissionIds } });
  const findGuestPermissionIds = await Promise.all(
    guestPermissions.map(async (permission) => {
      const permissionId = await Permission.findOne({ name: permission });
      if (!permissionId) console.log(" guest Permission Not Exist in Db", permission);
      return permissionId._id;
    })
  );

  await Role.updateOne({ _id: guestRoleId }, { $set: { permissions: findGuestPermissionIds } });
};
export { webPermissions, addAllNewPermissionsInDb, addPermissionsInRoles };
