import bcrypt from "bcrypt";
import { isValidObjectId } from "mongoose";
import { getEnv } from "../configs/config.js";
import { Auth } from "../models/auth.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { CustomError } from "../utils/customError.js";
import { JWTService } from "../utils/jwtService.js";
import { sendToken } from "../utils/sendToken.js";

// login
// ------
const login = asyncHandler(async (req, res, next) => {
  if (!req?.body) return next(new CustomError(400, "Please Provide Email and Password"));
  const { email, password } = req.body;
  if (!email || !password) return next(new CustomError(400, "Please Provide Email and Password"));
  const user = await Auth.findOne({ email }).select("+password");
  if (!user && !user?._id) return next(new CustomError(400, "Wrong email or password"));
  const matchPwd = await bcrypt.compare(password, user.password);
  if (!matchPwd) return next(new CustomError(400, "Wrong email or password"));
  await sendToken(res, next, user, 200, "Logged In Successfully");
});

// logout
// ---------
const logout = asyncHandler(async (req, res, next) => {
  const refreshToken = req?.cookies?.[getEnv("REFRESH_TOKEN_NAME")];
  if (refreshToken) await JWTService().removeRefreshToken(refreshToken);
  res.cookie(getEnv("ACCESS_TOKEN_NAME"), "", { maxAge: 0 });
  res.cookie(getEnv("REFRESH_TOKEN_NAME"), "", { maxAge: 0 });
  return res.status(200).json({ success: true, message: "Logged Out Successfully" });
});

// get My Profile
// ---------------
const getMyProfile = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;
  if (!isValidObjectId(userId)) return next(new CustomError(400, "Invalid User Id"));
  const user = await Auth.findById(userId);
  if (!user) return next(new CustomError(400, "User Not Found"));
  return res.status(200).json({ success: true, data: user });
});

// update my profile
// -----------------
const updateMyProfile = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;
  if (!isValidObjectId(userId)) return next(new CustomError(401, "Invalid User Id"));
  const user = await Auth.findById(userId);
  if (!user) return next(new CustomError(402, "User Not Found"));
  if (!req?.body) return next(new CustomError(403, "Please Provide at least one field"));
  const image = req.file;
  const { firstName, lastName, contact, address, country, state } = req.body;
  if (!firstName && !lastName && !contact && !address && !country && !state && !image)
    return next(new CustomError(403, "Please Provide at least one field"));
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (contact) user.contact = contact;
  if (address) user.address = address;
  if (country) user.country = country;
  if (state) user.state = state;
  if (image) {
    if (user?.image?.public_id) await removeFromCloudinary(user?.image?.public_id, "image");
    const newImage = await uploadOnCloudinary(image, "auth");
    if (!newImage) return next(new CustomError(403, "Error While Uploading Image"));
    user.image = { public_id: newImage.public_id, url: newImage.secure_url };
  }
  await user.save();
  return res.status(200).json({ success: true, message: "Profile Updated Successfully" });
});

export { login, logout, getMyProfile, updateMyProfile };
