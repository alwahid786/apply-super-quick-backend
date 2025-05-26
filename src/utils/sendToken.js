import { getEnv } from "../configs/config.js";
import { accessTokenOptions, refreshTokenOptions } from "../configs/constants.js";
import { JWTService } from "./jwtService.js";
import { CustomError } from "./customError.js";

const sendToken = async (res, next, user, statusCode, message) => {
  const accessToken = await JWTService().accessToken(String(user?._id));
  const refreshToken = await JWTService().refreshToken(String(user?._id));
  if (!accessToken || !refreshToken) return next(new CustomError(400, "Error While Generating Tokens"));
  await JWTService().storeRefreshToken(String(refreshToken));
  res.cookie(getEnv("ACCESS_TOKEN_NAME"), accessToken, accessTokenOptions);
  res.cookie(getEnv("REFRESH_TOKEN_NAME"), refreshToken, refreshTokenOptions);
  return res.status(statusCode).json({
    success: true,
    message: message,
    data: { ...user?._doc, password: null },
  });
};

export { sendToken };
