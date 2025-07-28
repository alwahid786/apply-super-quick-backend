import axios from "axios";
import { getEnv } from "../../../configs/config.js";
import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { CustomError } from "../../../global/utils/customError.js";
import qs from "qs";

// create id mission verification link and qr code
// ===============================================
const createIDmissionSession = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const accessToken = await getAccessToken();

  const response = await axios.post(
    "https://api.idmission.com/v4/customer/generate-identity-link",
    {
      customerData: {
        requestType: "IDV-FACE",
        personalData: {
          uniqueNumber: user?.id,
        },
        additionalData: {
          clientRequestID: user?._id,
          notifyLink: true,
        },
      },
      metadata: { source: "web" },
    },
    {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    }
  );

  // resp.data.qr_code could be a Base64 string, or resp.data.link_url
  res.json({
    success: true,
    data: response.data,
  });
});

// id mission webhook
// ==============================
const idMissionWebhook = asyncHandler(async (req, res) => {
  const result = req.body;

  console.log("webhook recieved", result);
  if (result?.status == "ID submitted") {
    // save the data of this id
  }
  res.status(200).json({ status_code: 0, status_message: "Success" });
});

// get proceed data
// ================
const getProceedData = asyncHandler(async (req, res) => {
  const accessToken = await getAccessToken();
  // const response = await axios.post(
  //   "https://api.idmission.com/v4/customer/get-processed-data",
  //   {
  //     additionalData: {
  //       verificationResultId: "140903205",
  //       sendProcessedImages: "N",
  //       stripSpecialCharacters: "Y",
  //     },
  //   },
  //   {
  //     headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
  //   }
  // );

  const url = "https://api.idmission.com/v4/customer";

  const resp = await axios.delete(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      customer: {
        client_customer_number: "686658c5bbfafad76e4fd47a",
      },
    },
  });

  res.status(200).send(resp);
});

export { createIDmissionSession, idMissionWebhook, getProceedData };

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
