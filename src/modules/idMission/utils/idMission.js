import qs from "qs";
import { getEnv } from "../../../configs/config.js";
import axios from "axios";

const getAccessToken = async () => {
  const clientId = getEnv("IDMISSION_CLIENT_ID");
  const clientSecret = getEnv("IDMISSION_CLIENT_SECRET");
  const tokenUrl = "https://auth.idmission.com/auth/realms/identity/protocol/openid-connect/token";

  const form = {
    grant_type: "password",
    scop: "api_access",
    client_id: clientId,
    client_secret: clientSecret,
    username: getEnv("IDMISSION_LOGIN_ID"),
    password: getEnv("IDMISSION_PASSWORD"),
  };

  const resp = await axios.post(tokenUrl, qs.stringify(form), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return resp?.data?.access_token;
};

export { getAccessToken };
