import axios from "axios";
import { Otp } from "../../../global/schemas/otp.model.js";
import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { sendMail } from "../../../global/utils/sendMail.js";
import { Auth } from "../../auth/schemas/auth.model.js";
import { sendToken } from "../../../global/utils/sendToken.js";
import { getAccessToken } from "../utils/idMission.js";
import { CustomError } from "../../../global/utils/customError.js";
import { Role } from "../../role/schemas/role.model.js";
import { emitToUser, getIO } from "../../../global/utils/socketIo.js";

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
        personalData: { uniqueNumber: user?.id },
        additionalData: { clientRequestID: user?._id, notifyLink: true },
      },
      metadata: { source: "web", customer: { email: user?.email, _id: user?._id } },
      POST_Data_API_Required: "Y",
    },
    { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } }
  );
  if (!response?.data) return next(new CustomError(400, "Error While Creating IDmission Session"));
  res.json({ success: true, data: response?.data });
});

// get proceed data
// ================
const getProceedData = asyncHandler(async (req, res) => {
  const accessToken = await getAccessToken();
  const response = await axios.post(
    "https://api.idmission.com/v4/customer/get-processed-data",
    {
      additionalData: {
        verificationResultId: "140903205",
        sendProcessedImages: "N",
        stripSpecialCharacters: "Y",
      },
    },
    {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    }
  );

  // const url = "https://api.idmission.com/v4/customer";
  // const resp = await axios.delete(url, {
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${accessToken}`,
  //   },
  //   data: {
  //     customer: {
  //       client_customer_number: "686658c5bbfafad76e4fd47a",
  //     },
  //   },
  // });

  res.status(200).send(resp);
});

// send otp on mail
// ================
const sendOTPOnMail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new CustomError(400, "Please Provide Email"));
  const otp = Math.floor(100000 + Math.random() * 900000);
  const newOtp = await Otp.findOneAndUpdate({ email }, { otp }, { upsert: true, new: true });
  if (!newOtp) return next(new CustomError(400, "Error While Creating otp, Please Try Again Later"));
  const isMailSent = await sendMail(email, "OTP FOR VERIFICATION", String(otp));
  if (!isMailSent) return next(new CustomError(400, "Error While Sending Mail"));
  return res.status(200).json({ success: true, message: "Mail Sent Successfully" });
});

// verify email and instant login with creating guest user account
// ==============================================================
const verifyEmailAndLogin = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) return next(new CustomError(400, "Please Provide Email and otp"));
  const optDoc = await Otp.findOne({ email, otp });
  if (!optDoc) return next(new CustomError(400, "Invalid Otp"));
  let user = await Auth.findOne({ email });
  if (!user?._id) {
    const role = await Role.findOneAndUpdate({ name: "guest" }, { name: "guest" }, { upsert: true, new: true });
    if (!role) return next(new CustomError(400, "Error While Creating otp, Please Try Again Later"));
    user = await Auth.create({ firstName: "Guest", lastName: "User", role: role?._id, password: "guest", email });
  }
  if (!user) return next(new CustomError(400, "Error While Creating otp, Please Try Again Later"));
  await sendToken(res, next, user, 200, "Email Verified Successfully");
});

// id mission webhook
// ==============================
const idMissionWebhook = asyncHandler(async (req, res) => {
  let result = req.body;
  if (result?.Form_Data) {
    result.Form_Data.Image_Front = "";
    result.Form_Data.Image_ProcessedFront = "";
    result.Form_Data.Image_Back = "";
    result.Form_Data.Image_ProcessedBack = "";
    result.Form_Data.Live_Customer_Photo = "";
  }

  console.log("webhook recieved", result);
  if (result?.status === "ID processing started") {
    emitToUser(result?.clientCustomerNumber, "idMission_processing_started", result);
  } else if (result?.Form_Status === "Approved") {
    emitToUser(result?.Form_Data?.Client_Customer_Number, "idMission_verified", result);
  } else if (
    // result?.Form_Status === "Expired ID" ||
    // result?.Form_Status === "Suspected Tampering" ||
    // result?.Form_Status === "Facial Biometric Match Failed"
    result?.Form_Status &&
    result?.Form_Status !== "Approved"
  ) {
    emitToUser(result?.Form_Data?.Client_Customer_Number, "idMission_failed", result);
  }

  res.status(200).json({ status_code: 0, status_message: "Success" });
});

export { createIDmissionSession, getProceedData, idMissionWebhook, sendOTPOnMail, verifyEmailAndLogin };
