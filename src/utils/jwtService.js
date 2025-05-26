import jwt from "jsonwebtoken";
import { getEnv } from "../configs/config.js";
import { Token } from "../models/token.model.js";

export const JWTService = () => {
  return {
    // create access token
    async accessToken(_id) {
      return jwt.sign({ _id }, getEnv("ACCESS_TOKEN_SECRET"), {
        expiresIn: getEnv("ACCESS_TOKEN_EXPIRY_TIME"),
      });
    },
    // create refresh token
    async refreshToken(_id) {
      return jwt.sign({ _id }, getEnv("REFRESH_TOKEN_SECRET"), {
        expiresIn: getEnv("REFRESH_TOKEN_EXPIRY_TIME"),
      });
    },
    // create verification token
    async verificationToken(_id) {
      return jwt.sign({ _id }, getEnv("VERIFICATION_TOKEN_SECRET"), {
        expiresIn: getEnv("VERIFICATION_TOKEN_EXPIRY_TIME"),
      });
    },
    // verify tokens
    async verifyToken(token, tokenSecret) {
      try {
        return await jwt.verify(token, tokenSecret);
      } catch (error) {
        return null;
      }
    },
    // store refresh token in database
    async storeRefreshToken(token) {
      try {
        await Token.create({ token });
      } catch (error) {
        throw new Error(error?.message || "Failed to store refresh token");
      }
    },
    // remove from data base
    async removeRefreshToken(token) {
      try {
        await Token.deleteOne({ token });
      } catch (error) {
        throw new Error(error?.message || "Failed to remove refresh token");
      }
    },
  };
};
