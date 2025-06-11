import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { CustomError } from "../../../global/utils/customError.js";
import { initializeSession } from "../utils/idMission.js";

const messageStore = new Map();
const verificationStore = new Map();

// create id mission session
// ------------------------
const createIdMissionSession = asyncHandler(async (req, res, next) => {
  if (!req?.body) return next(new CustomError(400, "Please provide all required fields"));

  const { email, name, phone } = req.body;
  if (!email || !name || !phone) {
    return next(new CustomError(400, "Email, name, and phone are required"));
  }
  try {
    const sessionResult = await initializeSession(true, { email, name, phone }, req);
    if (!sessionResult.success)
      return next(new CustomError(400, sessionResult.error || "Failed to initialize ID verification session"));
    const portalSession = sessionResult?.portalSession || {};
    return res.status(200).json({
      success: true,
      message: "ID verification session created successfully",
      sessionId: sessionResult?.sessionId,
      idMissionSessionId: portalSession?.id,
      webUrl: portalSession?.web_url || portalSession?.verification_urls?.web || portalSession?.url,
      mobileUrl:
        portalSession?.mobile_url || portalSession?.verification_urls?.mobile || portalSession?.mobile_verification_url,
      emailVerificationUrl: sessionResult?.verificationUrls?.emailVerificationUrl,
      phoneVerificationUrl: sessionResult?.verificationUrls?.phoneVerificationUrl,
      customerId: sessionResult?.customerId,
      contactVerificationEnabled: sessionResult?.contactVerificationEnabled,
      apiCredentials: {
        loginId: sessionResult?.loginId,
        apiKey: sessionResult?.apiKey,
        keyId: sessionResult?.apiKeyId,
      },
    });
  } catch (error) {
    console.error("Error in createIdMissionSession:", error);
    return next(new CustomError(500, "Internal server error during session creation"));
  }
});
// verify email
// ------------
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token, email, sessionId } = req.query;
  const key = `${sessionId}_${token}`;
  if (!verificationStore.has(key)) {
    verificationStore.set(key, {
      sessionId,
      email,
      phone: null,
      emailVerified: false,
      phoneVerified: false,
      token,
      createdAt: new Date(),
    });
  }
  const verification = verificationStore.get(key);
  verification.emailVerified = true;
  verification.emailVerifiedAt = new Date();
  console.log(`Redirecting to /verification-success?type=email&sessionId=${sessionId}`);
  // res.redirect(`/verification-success?type=email&sessionId=${sessionId}`);
  return res.status(200).json({ success: true, message: "Email verified successfully" });
});
// verify phone
// ------------
const verifyPhone = asyncHandler(async (req, res, next) => {
  const { token, email, sessionId } = req.query;
  const key = `${sessionId}_${token}`;

  if (!verificationStore.has(key)) {
    verificationStore.set(key, {
      sessionId,
      email: null,
      phone,
      emailVerified: false,
      phoneVerified: false,
      token,
      createdAt: new Date(),
    });
  }

  const verification = verificationStore.get(key);
  verification.phoneVerified = true;
  verification.phoneVerifiedAt = new Date();

  console.log(`Phone verified for session: ${sessionId}`);

  return res.status(200).json({ success: true, message: "Phone verified successfully" });
});
// get result from id mission
// -------------------------
const getIdMissionResult = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  if (!sessionId) return next(new CustomError(400, "Session ID is required"));
  // Retrieve verification results from IDMission
  const result = await idMissionService.getVerificationResults(sessionId);
  if (!result.success) return next(new CustomError(400, "Failed to get verification results"));
  if (result.verified) {
    messageStore.addMessage(sessionId, "idmission_verification_complete", {
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      status: "verified",
      idData: result?.idData,
    });
  }
  return res.status(200).json({
    success: true,
    message: "Verification results retrieved successfully",
    result,
  });
});

export { createIdMissionSession, getIdMissionResult, verifyEmail, verifyPhone };
