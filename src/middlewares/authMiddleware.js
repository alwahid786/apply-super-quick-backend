import { getEnv } from "../configs/config.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CustomError } from "../utils/customError.js";
import { Auth } from "../models/auth.model.js";
import { JWTService } from "../utils/jwtService.js";
import { accessTokenOptions } from "../configs/constants.js";
import { isValidObjectId } from "mongoose";

// auth middleware
// ---------------
const isAuthenticated = asyncHandler(async (req, res, next) => {
  try {
    const accessToken = req?.cookies?.[getEnv("ACCESS_TOKEN_NAME")];
    const refreshToken = req.cookies?.[getEnv("REFRESH_TOKEN_NAME")];
    if (!accessToken && !refreshToken) return next(new CustomError(401, "Please Login First"));
    let userExist = true;
    let user;
    const decoded = await JWTService().verifyToken(accessToken, getEnv("ACCESS_TOKEN_SECRET"));
    if (!decoded?._id) userExist = false;
    if (userExist) user = await Auth.findById(decoded?._id);
    if (!user) userExist = false;
    if (!userExist) {
      const decoded = await JWTService().verifyToken(refreshToken, getEnv("REFRESH_TOKEN_SECRET"));
      if (!decoded) return next(new CustomError(401, "Please Login First"));
      user = await Auth.findById(decoded?._id);
      if (!user) return next(new CustomError(401, "Please Login First"));
      // create new access token
      const accessToken = await JWTService().accessToken(String(user?._id));
      res.cookie(getEnv("ACCESS_TOKEN_NAME"), accessToken, accessTokenOptions);
      req.user = user;
      return next();
    }
    req.user = user;
    return next();
  } catch (error) {
    console.log("Error in isAuthenticated:", error);
    return next(new CustomError(401, "Please Login First"));
  }
});

// auth middleware
// ---------------
const isAuthorized = (permissionName) => {
  return asyncHandler(async (req, res, next) => {
    try {
      const userId = req?.user?._id;
      if (!isValidObjectId(userId)) return next(new CustomError(400, "Invalid User Id"));
      const user = await Auth.findById(userId).populate({ path: "role", populate: { path: "permissions" } });
      const hasPermission = user?.role?.permissions?.some((p) => p.name == permissionName);
      if (!hasPermission) return next(new CustomError(403, "You are not authorized to perform this action"));
      return next();
    } catch (error) {
      console.log("Error in isAuthorized:", error);
      return next(new CustomError(500, "Error while checking authorization"));
    }
  });
};

export { isAuthenticated, isAuthorized };
