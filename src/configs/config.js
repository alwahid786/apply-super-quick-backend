import dotenv from "dotenv";
dotenv.config();

const config = Object.freeze({
  // global credentials
  // ------------------
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URL: process.env.MONGODB_URL,
  MONGODB_NAME: process.env.MONGODB_NAME,
  MONGODB_URL_TEST: process.env.MONGODB_URL_TEST,
  MONGODB_NAME_TEST: process.env.MONGODB_NAME_TEST,
  RESET_PASSWORD_URL: process.env.RESET_PASSWORD_URL,
  CORS_URLS: process.env.CORS_URLS.split(","),
  SERVER_URL: process.env.SERVER_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  // jwt token credentials
  // ---------------------
  ACCESS_TOKEN_EXPIRY_TIME: process.env.ACCESS_TOKEN_EXPIRY_TIME,
  ACCESS_TOKEN_MAX_AGE: process.env.ACCESS_TOKEN_MAX_AGE,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_NAME: process.env.ACCESS_TOKEN_NAME,
  REFRESH_TOKEN_EXPIRY_TIME: process.env.REFRESH_TOKEN_EXPIRY_TIME,
  REFRESH_TOKEN_MAX_AGE: process.env.REFRESH_TOKEN_MAX_AGE,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_NAME: process.env.REFRESH_TOKEN_NAME,
  VERIFICATION_TOKEN_SECRET: process.env.VERIFICATION_TOKEN_SECRET,
  VERIFICATION_TOKEN_EXPIRY_TIME: process.env.VERIFICATION_TOKEN_EXPIRY_TIME,
  // cloudinary credentials
  // ---------------------
  CLOUDINARY_CLIENT_KEY: process.env.CLOUDINARY_CLIENT_KEY,
  CLOUDINARY_CLIENT_NAME: process.env.CLOUDINARY_CLIENT_NAME,
  CLOUDINARY_CLIENT_SECRET: process.env.CLOUDINARY_CLIENT_SECRET,
  CLOUDINARY_FOLDER_NAME: process.env.CLOUDINARY_FOLDER_NAME,
  //nodemailer configs
  // -----------------
  NODEMAILER_FROM: process.env.NODEMAILER_FROM,
  NODEMAILER_HOST: process.env.NODEMAILER_HOST,
  NODEMAILER_PASSWORD: process.env.NODEMAILER_PASSWORD,
  NODEMAILER_PORT: process.env.NODEMAILER_PORT,
  NODEMAILER_USER: process.env.NODEMAILER_USER,
  // id mission configs
  // -----------------

  IDMISSION_LOGIN_ID: process.env.IDMISSION_LOGIN_ID,
  IDMISSION_PASSWORD: process.env.IDMISSION_PASSWORD,

  IDMISSION_CLIENT_ID: process.env.IDMISSION_CLIENT_ID,
  IDMISSION_CLIENT_SECRET: process.env.IDMISSION_CLIENT_SECRET,

  IDMISSION_API_KEY: process.env.IDMISSION_API_KEY,
  IDMISSION_API_SECRET: process.env.IDMISSION_API_SECRET,

  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
});

const getEnv = (key) => {
  const value = config[key];
  if (!value) throw new Error(`Config ${key} not found`);
  return value;
};

export { getEnv };
