import axios from "axios";
import { getEnv } from "../../../configs/config.js";

export function getAppBaseUrl(req, fallbackHost = SERVER_URL) {
  // 2) If you have an incoming request (SSR or webhook)…
  if (req) {
    const protocol = req.protocol;
    const host = req.get("host");
    const origin = `${protocol}://${host}`;
    console.log(`Derived base URL from request: ${origin}`);
    return origin;
  }

  // 3) Local‐only fallback
  console.log(`Falling back to localhost: ${fallbackHost}`);
  return fallbackHost;
}
export function buildAppUrl(path, req, queryParams = {}) {
  const origin = getAppBaseUrl(req);
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const qs = Object.keys(queryParams).length ? "?" + new URLSearchParams(queryParams).toString() : "";
  const full = `${origin}${normalized}${qs}`;
  console.log(`Built app URL: ${full}`);
  return full;
}
// Check for required environment variables
// if (
//   !getEnv("IDMISSION_USER_ID") ||
//   !getEnv("IDMISSION_PASSWORD") ||
//   !getEnv("IDMISSION_API_KEY_SECRET") ||
//   !getEnv("IDMISSION_API_KEY_ID")
// ) {
//   console.error("Missing required IDMission environment variables");
// }

// IDMission API configuration
// const IDMISSION_LOGIN_ID = getEnv("IDMISSION_MERCHANT_ID") || "";
const SERVER_URL = getEnv("SERVER_URL") || "";
// const IDMISSION_API_KEY = getEnv("IDMISSION_API_KEY_ID") || "";
// const IDMISSION_KEY_ID = getEnv("IDMISSION_KEY_ID") || "";
// const IDMISSION_API_SECRET = getEnv("IDMISSION_API_KEY_SECRET") || "";

export async function createIDmissionSession(product = "biometric", environment = "TEST") {
  // try {
  //   const response = await axios.post(
  //     process.env.IDMISSION_API_URL,
  //     {
  //       client_id: IDMISSION_KEY_ID,
  //       client_key: IDMISSION_API_KEY,
  //       product,
  //       environment,
  //     },
  //     {
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   return response.data;
  // } catch (error) {
  //   console.error("IDmission session error:", error.response?.data || error.message);
  //   throw new Error("Failed to create IDmission session");
  // }
}

export async function initializeSession(useWebSdk = true, contactInfo, req) {
  // const timestamp = Date.now();
  // const customerId = `customer_${timestamp}`;
  // try {
  //   if (!IDMISSION_KEY_ID || !IDMISSION_API_SECRET)
  //     throw new Error("Missing required IDMission API Key ID or API Secret");
  //   console.log(`Creating IDMission Portal session with API Key ID: ${IDMISSION_KEY_ID}`);
  //   const requestPayload = {
  //     api_key_id: IDMISSION_KEY_ID,
  //     api_key_secret: IDMISSION_API_SECRET,
  //     personal_data: contactInfo
  //       ? {
  //           email: contactInfo.email,
  //           phone: contactInfo.phone,
  //           name: contactInfo.name,
  //           verify_email: false,
  //           verify_phone: false,
  //         }
  //       : undefined,
  //     notification_settings: {
  //       webhook_url: buildAppUrl("/api/id-verification/webhook"),
  //       mobile_handover_webhook_url: buildAppUrl("/api/id-verification/mobile-handover"),
  //       review_status_webhook_url: buildAppUrl("/api/id-verification/review-status"),
  //       decline_status_webhook_url: buildAppUrl("/api/id-verification/decline-status"),
  //       include_input_images: true,
  //       include_processed_images: true,
  //       exclude_pii_data: false,
  //       POST_Data_API_Required: "Y",
  //     },
  //     verification_settings: contactInfo
  //       ? {
  //           redirect_url: buildAppUrl(`/id-verification-idmission?verify=true&sessionId=${customerId}`, req),
  //           verification_page_settings: {
  //             company_name: "FinTainium",
  //             logo_url: "https://gofintainium.com/wp-content/uploads/2023/08/cropped-Fintainium_Gold_RGB_Small.png",
  //             primary_color: "#FFB81C",
  //             show_help_section: true,
  //           },
  //         }
  //       : undefined,
  //   };
  //   console.log(
  //     "IDMission Portal API request payload:",
  //     JSON.stringify(
  //       {
  //         ...requestPayload,
  //         api_key_secret: "***REDACTED***",
  //       },
  //       null,
  //       2
  //     )
  //   );
  //   const portalResponse = await axios({
  //     method: "post",
  //     url: "https://portal-api.idmission.com/portal.sessions.v1.SessionsService/CreateSession",
  //     data: requestPayload,
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     validateStatus: function (status) {
  //       return true;
  //     },
  //   });
  //   console.log(`IDMission Portal API response status: ${portalResponse.status}`);
  //   console.log("IDMission Portal API response data:", JSON.stringify(portalResponse.data, null, 2));
  //   if (portalResponse.status === 200 && portalResponse.data?.session?.id) {
  //     const portalSession = portalResponse.data.session;
  //     console.log(`Successfully created IDMission Portal session: ${portalSession.id}`);
  //     console.log("Full portal session object:", JSON.stringify(portalSession, null, 2));
  //     if (contactInfo && (contactInfo.email || contactInfo.phone)) {
  //       console.log("Contact verification enabled with the following properties:");
  //       if (contactInfo.email) {
  //         console.log(`Email: ${contactInfo.email}`);
  //       }
  //       if (contactInfo.phone) {
  //         console.log(`Phone: ${contactInfo.phone}`);
  //       }
  //       console.log("Session verification details:", JSON.stringify(portalSession.verification_details || {}));
  //       const emailVerificationUrl =
  //         portalSession.email_verification_url || portalSession.verification_details?.email_verification_url;
  //       const phoneVerificationUrl =
  //         portalSession.phone_verification_url || portalSession.verification_details?.phone_verification_url;
  //       console.log(
  //         "Found verification URLs:",
  //         emailVerificationUrl ? "Email URL exists" : "No Email URL",
  //         phoneVerificationUrl ? "Phone URL exists" : "No Phone URL"
  //       );
  //     }
  //     let verificationUrls = {
  //       emailVerificationUrl:
  //         portalSession.email_verification_url ||
  //         portalSession.verification_details?.email_verification_url ||
  //         portalSession.verification_urls?.email,
  //       phoneVerificationUrl:
  //         portalSession.phone_verification_url ||
  //         portalSession.verification_details?.phone_verification_url ||
  //         portalSession.verification_urls?.phone,
  //     };
  //     if (contactInfo && (!verificationUrls.emailVerificationUrl || !verificationUrls.phoneVerificationUrl)) {
  //       console.log("IDMission did not provide verification URLs - creating demo verification links");
  //       const verificationToken = `verify_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  //       const baseUrl = "https://workspace.rick156.repl.co";
  //       if (contactInfo.email && !verificationUrls.emailVerificationUrl) {
  //         verificationUrls.emailVerificationUrl = buildAppUrl("/api/id-mission/email-verify", req, {
  //           token: verificationToken,
  //           email: contactInfo.email,
  //           sessionId: portalSession.id,
  //         });
  //       }
  //       if (contactInfo.phone && !verificationUrls.phoneVerificationUrl) {
  //         verificationUrls.phoneVerificationUrl = buildAppUrl("/api/id-mission/phone-verify", null, {
  //           token: verificationToken,
  //           phone: contactInfo.phone,
  //           sessionId: portalSession.id,
  //         });
  //       }
  //     }
  //     return {
  //       success: true,
  //       sessionId: portalSession.id,
  //       portalSession: portalSession,
  //       loginId: IDMISSION_LOGIN_ID,
  //       merchantLoginId: IDMISSION_LOGIN_ID,
  //       apiKey: IDMISSION_API_KEY,
  //       apiSecret: IDMISSION_API_SECRET,
  //       apiKeyId: IDMISSION_KEY_ID,
  //       customerId: customerId,
  //       useWebSdk: true,
  //       usePortalApi: true,
  //       contactInfo: contactInfo || undefined,
  //       contactVerificationEnabled: !!(contactInfo?.email || contactInfo?.phone),
  //       verificationUrls:
  //         verificationUrls.emailVerificationUrl || verificationUrls.phoneVerificationUrl ? verificationUrls : undefined,
  //     };
  //   } else {
  //     console.error("Failed to create IDMission Portal session:", portalResponse.data);
  //     console.log("Falling back to manual session ID generation...");
  //     const sessionId = `session_${timestamp}`;
  //     if (!IDMISSION_LOGIN_ID) {
  //       throw new Error("Missing required IDMission Login ID");
  //     }
  //     return {
  //       success: true,
  //       sessionId: sessionId,
  //       loginId: IDMISSION_LOGIN_ID,
  //       merchantLoginId: IDMISSION_LOGIN_ID,
  //       apiKey: IDMISSION_API_KEY,
  //       apiSecret: IDMISSION_API_SECRET,
  //       keyId: IDMISSION_KEY_ID,
  //       customerId: customerId,
  //       useWebSdk: true,
  //       usePortalApi: false,
  //       contactInfo: contactInfo || undefined,
  //       contactVerificationEnabled: !!(contactInfo?.email || contactInfo?.phone),
  //     };
  //   }
  // } catch (error) {
  //   console.error("Error initializing IDMission session:", error);
  //   const sessionId = `session_${timestamp}`;
  //   return {
  //     success: false,
  //     error: error.message,
  //     sessionId: sessionId,
  //     customerId: customerId,
  //   };
  // }
}
