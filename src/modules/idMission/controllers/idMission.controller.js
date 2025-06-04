import { asyncHandler } from "../../../global/utils/asyncHandler.js";
import { CustomError } from "../../../global/utils/customError.js";

// create id mission session
// ------------------------
const createIdMissionSession = asyncHandler(async (req, res, next) => {
  if (!req?.body) return next(new CustomError(400, "Please Provide all fields"));
  const { sessionId, email, name, phone } = req.body;
  if (!email || !name || !phone) return next(new CustomError(400, "Please Provide all fields"));
  if (!sessionId) return next(new CustomError(400, "Session ID is required"));
  // Initialize a session with IDMission
  const sessionResult = await initializeSession(true, { email, name, phone });
  if (!sessionResult.success) return next(new CustomError(400, "Failed to initialize ID verification session"));
  // Extract the portal session details
  const portalSession = sessionResult?.portalSession || {};
  // Return the necessary information for the client
  return res.status(200).json({
    success: true,
    message: "ID verification session created successfully",
    sessionId: sessionResult?.sessionId,
    idMissionSessionId: portalSession?.id,
    webUrl: portalSession?.web_url || portalSession?.verification_urls?.web,
    mobileUrl: portalSession?.mobile_url || portalSession?.verification_urls?.mobile,
    emailVerificationUrl: sessionResult?.verificationUrls?.emailVerificationUrl,
    phoneVerificationUrl: sessionResult?.verificationUrls?.phoneVerificationUrl,
  });
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

export { createIdMissionSession, getIdMissionResult };
