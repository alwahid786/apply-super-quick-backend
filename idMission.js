import axios from "axios";
import crypto from "crypto";
import qs from "querystring";
import { buildAppUrl } from "../utils/replit-domain";
import { messageStore } from "./message-store";
import { getEnv } from "./src/configs/config";

// IDMISSION_MERCHANT_ID: process.env.IDMISSION_MERCHANT_ID,
// IDMISSION_USER_ID: process.env.IDMISSION_USER_ID,
// IDMISSION_PASSWORD: process.env.IDMISSION_PASSWORD,
// IDMISSION_CLIENT_SECRET: process.env.IDMISSION_CLIENT_SECRET,
// IDMISSION_API_KEY: process.env.IDMISSION_API_KEY,
// IDMISSION_API_SECRET: process.env.IDMISSION_API_SECRET,
// IDMISSION_KEY_ID: process.env.IDMISSION_KEY_ID,
// IDMISSION_BASE_URL: process.env.IDMISSION_BASE_URL,
// SESSION_SECRET: process.env.SESSION_SECRET,

// Check for required environment variables
if (
  !getEnv("IDMISSION_USER_ID") ||
  !getEnv("IDMISSION_PASSWORD") ||
  !getEnv("IDMISSION_API_SECRET") ||
  !getEnv("IDMISSION_KEY_ID")
) {
  console.error("Missing required IDMission environment variables");
}

// IDMission API configuration
// Using v4 endpoint as specified
const IDMISSION_BASE_URL = getEnv("IDMISSION_BASE_URL");
// Read environment variables for credentials
const IDMISSION_LOGIN_ID = getEnv("IDMISSION_LOGIN_ID") || "";
const IDMISSION_USER_ID = getEnv("IDMISSION_USER_ID") || "";
const IDMISSION_PASSWORD = getEnv("IDMISSION_PASSWORD") || "";
const IDMISSION_CLIENT_SECRET = getEnv("IDMISSION_CLIENT_SECRET") || "";
const IDMISSION_API_KEY = getEnv("IDMISSION_API_KEY_ID") || "";
const IDMISSION_KEY_ID = getEnv("IDMISSION_KEY_ID") || "";
const IDMISSION_API_SECRET = getEnv("IDMISSION_API_KEY_SECRET") || "";

// Log API configuration for debugging (without exposing sensitive information)
console.log(`IDMission API Configuration: 
  Login ID: ${IDMISSION_LOGIN_ID}
  User ID: ${IDMISSION_USER_ID ? "***set***" : "Not set"}
  Password: ${IDMISSION_PASSWORD ? "***set***" : "Not set"}
  Client Secret: ${IDMISSION_CLIENT_SECRET ? "***set***" : "Not set"}
  API Key: ${IDMISSION_API_KEY ? "***set***" : "Not set"}
  API Secret: ${IDMISSION_API_SECRET ? "***set***" : "Not set"}
  Key ID: ${IDMISSION_KEY_ID ? "***set***" : "Not set"}
  Base URL: ${IDMISSION_BASE_URL}
`);

// Track access token
let accessToken  = null;
let tokenExpiry = 0;

// Get authentication token for IDMission API
async function getAccessToken() {
  // Check if we already have a valid token
  const now = Date.now();
  if (accessToken && tokenExpiry > now) {
    return accessToken;
  }

  try {
    // Use Portal API-based authentication which is more reliable
    if (IDMISSION_KEY_ID && IDMISSION_API_SECRET) {
      console.log(`Using Portal API authentication with key ID: ${IDMISSION_KEY_ID}`);

      // For Portal API we don't need an actual OAuth token
      // But we'll create a temporary token for consistency in our code
      accessToken = `portal_api_key_${IDMISSION_KEY_ID}`;
      tokenExpiry = now + 3600 * 1000; // 1 hour validity

      return accessToken;
    }

    // Fallback to OAuth token if Portal API credentials are not available
    console.log("Portal API credentials not available, trying OAuth token");

    console.error("Unable to authenticate with IDMission API - Portal API credentials are recommended");
    throw new Error("IDMission authentication failed - Portal API credentials are required");
  } catch (error) {
    console.error("Error getting IDMission access token:", error);
    throw error;
  }
}

// Helper function to generate required headers for IDMission API
async function generateHeaders() {
  try {
    // Get OAuth token
    const token = await getAccessToken();

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  } catch (error) {
    console.error("Error generating headers:", error);
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }
}

// Helper function to create signature for IDMission API
function createSignature(data, apiSecret, timestamp) {
  try {
    const hmac = crypto.createHmac("sha256", apiSecret);
    hmac.update(data);
    return hmac.digest("hex");
  } catch (error) {
    console.error("Error creating signature:", error);
    return "";
  }
}

/**
 * Initialize a new ID verification session
 * @param useWebSdk Whether to use the Web SDK approach instead of the API-based approach
 * @param contactInfo Optional contact information for verification (email and phone)
 * @returns Session data for initializing the verification
 */
export async function initializeSession(
  useWebSdk: boolean = true,
  contactInfo?: {
    email?: string;
    phone?: string;
    name?: string;
  }
) {
  // Create common identifiers
  const timestamp = Date.now();
  const customerId = `customer_${timestamp}`;
  const applicationId = `app_${timestamp}`;

  // Use the actual Replit domain for callbacks
  const replitDomain = `https://2b07203d-be4a-4aa6-ab8f-fce8ce711a4f-5000.rick156.repl.co`;

  // Using the Portal API approach (preferred)
  try {
    // Check for required credentials
    if (!IDMISSION_KEY_ID || !IDMISSION_API_SECRET) {
      throw new Error("Missing required IDMission API Key ID or API Secret");
    }

    console.log(`Creating IDMission Portal session with API Key ID: ${IDMISSION_KEY_ID}`);

    // Create the request payload
    const requestPayload = {
      api_key_id: IDMISSION_KEY_ID,
      api_key_secret: IDMISSION_API_SECRET,
      personal_data: contactInfo
        ? {
            email: contactInfo.email,
            phone: contactInfo.phone,
            name: contactInfo.name,
            // Disable IDMission's built-in verification - we'll use our own SendGrid implementation
            verify_email: false,
            verify_phone: false,
          }
        : undefined,
      // Disable IDMission's built-in email/SMS notifications - we'll use our own SendGrid implementation
      notification_settings: {
        // Include webhook configuration based on provided settings
        webhook_url: buildAppUrl("/api/id-verification/webhook"),
        mobile_handover_webhook_url: buildAppUrl("/api/id-verification/mobile-handover"),
        review_status_webhook_url: buildAppUrl("/api/id-verification/review-status"),
        decline_status_webhook_url: buildAppUrl("/api/id-verification/decline-status"),
        include_input_images: true,
        include_processed_images: true,
        exclude_pii_data: false,
        POST_Data_API_Required: "Y", // Enable webhook with JSON data according to the format
      },
      verification_settings: contactInfo
        ? {
            redirect_url: `${
              process.env.APP_URL || "http://localhost:5000"
            }/id-verification-idmission?verify=true&sessionId=${customerId}`,
            verification_page_settings: {
              company_name: "FinTainium",
              logo_url: "https://gofintainium.com/wp-content/uploads/2023/08/cropped-Fintainium_Gold_RGB_Small.png",
              primary_color: "#FFB81C",
              show_help_section: true,
            },
          }
        : undefined,
    };

    // Log the request payload for debugging (without secrets)
    console.log(
      "IDMission Portal API request payload:",
      JSON.stringify(
        {
          ...requestPayload,
          api_key_secret: "***REDACTED***",
        },
        null,
        2
      )
    );

    // Create a session using the Portal API with personal data for contact verification
    const portalResponse = await axios({
      method: "post",
      url: "https://portal-api.idmission.com/portal.sessions.v1.SessionsService/CreateSession",
      data: requestPayload,
      headers: {
        "Content-Type": "application/json",
      },
      validateStatus: function (status) {
        // Accept any status code to handle it manually
        return true;
      },
    });

    // Log the response for debugging
    console.log(`IDMission Portal API response status: ${portalResponse.status}`);

    // Print full response data for debugging
    console.log("IDMission Portal API response data:", JSON.stringify(portalResponse.data, null, 2));

    // Check if we got a successful response
    if (portalResponse.status === 200 && portalResponse.data?.session?.id) {
      const portalSession = portalResponse.data.session;
      console.log(`Successfully created IDMission Portal session: ${portalSession.id}`);

      // Debug the full session object to see all available fields
      console.log("Full portal session object:", JSON.stringify(portalSession, null, 2));

      // Log the session details for verification features
      if (contactInfo && (contactInfo.email || contactInfo.phone)) {
        console.log("Contact verification enabled with the following properties:");
        if (contactInfo.email) {
          console.log(`Email: ${contactInfo.email}`);
        }
        if (contactInfo.phone) {
          console.log(`Phone: ${contactInfo.phone}`);
        }
        console.log("Session verification details:", JSON.stringify(portalSession.verification_details || {}));

        // Check if there are any URLs in the session object
        const emailVerificationUrl =
          portalSession.email_verification_url || portalSession.verification_details?.email_verification_url;
        const phoneVerificationUrl =
          portalSession.phone_verification_url || portalSession.verification_details?.phone_verification_url;

        console.log(
          "Found verification URLs:",
          emailVerificationUrl ? "Email URL exists" : "No Email URL",
          phoneVerificationUrl ? "Phone URL exists" : "No Phone URL"
        );
      }

      // Prepare contact verification URLs if available from IDMission
      let verificationUrls: any = {
        emailVerificationUrl:
          portalSession.email_verification_url ||
          portalSession.verification_details?.email_verification_url ||
          portalSession.verification_urls?.email,
        phoneVerificationUrl:
          portalSession.phone_verification_url ||
          portalSession.verification_details?.phone_verification_url ||
          portalSession.verification_urls?.phone,
      };

      // If IDMission is not providing the URLs but we have contact info, create our own demo verification URLs
      if (contactInfo && (!verificationUrls.emailVerificationUrl || !verificationUrls.phoneVerificationUrl)) {
        console.log("IDMission did not provide verification URLs - creating demo verification links");

        // Generate a unique token for this verification
        const verificationToken = `verify_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

        // Use a simple hardcoded base URL to avoid any potential import/require issues
        const baseUrl = "https://workspace.rick156.repl.co";

        if (contactInfo.email && !verificationUrls.emailVerificationUrl) {
          // Use the direct React route instead of the API endpoint for better compatibility
          verificationUrls.emailVerificationUrl = `${baseUrl}/email-verify?token=${verificationToken}&email=${encodeURIComponent(
            contactInfo.email
          )}&sessionId=${portalSession.id}`;
          console.log("Created email verification URL:", verificationUrls.emailVerificationUrl);
        }

        if (contactInfo.phone && !verificationUrls.phoneVerificationUrl) {
          verificationUrls.phoneVerificationUrl = buildAppUrl("/api/contact-verification/phone", null, {
            token: verificationToken,
            phone: contactInfo.phone,
            sessionId: portalSession.id,
          });
        }
      }

      // Return the necessary data for initializing the Web SDK
      return {
        success: true,
        sessionId: portalSession.id,
        portalSession: portalSession,
        loginId: IDMISSION_LOGIN_ID,
        merchantLoginId: IDMISSION_LOGIN_ID,
        apiKey: IDMISSION_API_KEY,
        apiSecret: IDMISSION_API_SECRET,
        apiKeyId: IDMISSION_KEY_ID,
        customerId: customerId,
        useWebSdk: true,
        usePortalApi: true,
        contactInfo: contactInfo || undefined,
        contactVerificationEnabled: !!(contactInfo?.email || contactInfo?.phone),
        verificationUrls:
          verificationUrls.emailVerificationUrl || verificationUrls.phoneVerificationUrl ? verificationUrls : undefined,
      };
    } else {
      console.error("Failed to create IDMission Portal session:", portalResponse.data);

      // Fall back to the Web SDK approach without Portal API
      console.log("Falling back to manual session ID generation...");

      // For the Web SDK, we can just generate a session ID ourselves
      const sessionId = `session_${timestamp}`;

      // Check for required credentials
      if (!IDMISSION_LOGIN_ID) {
        throw new Error("Missing required IDMission Login ID");
      }

      // Return the necessary data for initializing the Web SDK
      return {
        success: true,
        sessionId: sessionId,
        loginId: IDMISSION_LOGIN_ID,
        merchantLoginId: IDMISSION_LOGIN_ID,
        apiKey: IDMISSION_API_KEY,
        apiSecret: IDMISSION_API_SECRET,
        keyId: IDMISSION_KEY_ID,
        customerId: customerId,
        useWebSdk: true,
        usePortalApi: false,
        contactInfo: contactInfo || undefined,
        contactVerificationEnabled: !!(contactInfo?.email || contactInfo?.phone),
      };
    }
  } catch (error: any) {
    console.error("Error initializing IDMission session:", error);

    // Fall back to manual session ID generation due to error
    const sessionId = `session_${timestamp}`;

    return {
      success: false,
      error: error.message,
      sessionId: sessionId,
      customerId: customerId,
    };
  }
}

/**
 * Retrieves the verification results for a completed session
 * @param sessionId IDMission session ID from initialization
 * @returns Verification results including ID data and match status
 */
export async function getVerificationResults(sessionId: string) {
  try {
    // First check if we already have webhook data for this session in our message store
    console.log(`Checking for webhook data for session ID: ${sessionId}`);

    // Check for existing webhook data
    try {
      const messages = await messageStore.getMessagesForToken(sessionId);
      const verificationResults = messages
        .filter((msg) => msg.type === "idmission_verification_result" || msg.type === "idmission_webhook")
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // If we have webhook data, return it
      if (verificationResults.length > 0) {
        console.log(`Found ${verificationResults.length} verification results for session: ${sessionId}`);
        return {
          success: true,
          data: verificationResults[0].data,
          fromWebhook: true,
          webhookTimestamp: verificationResults[0].timestamp,
        };
      }

      console.log(`No webhook verification data found for session: ${sessionId}`);
    } catch (webhookError) {
      console.error("Error checking for webhook data:", webhookError);
    }

    // If we don't have webhook data, inform the client that webhook is preferred
    console.log("Webhook data not found - webhooks are the preferred method for verification data");

    // Try to get verification data directly from the validate-id-match-face API
    try {
      console.log(
        `Attempting to fetch verification data directly from validate-id-match-face API for session: ${sessionId}`
      );

      // Create API signature for IDMission Portal API
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const data = `${IDMISSION_KEY_ID}${timestamp}`;
      const signature = createSignature(data, IDMISSION_API_SECRET, timestamp);

      // Extract the crucial parts of the session ID
      // IDMission API expects simpler ID formats, not the full URN
      let clientRequestId = sessionId;

      // If it's a URN format, extract just the UUID part at the end
      if (sessionId.startsWith("urn:")) {
        const uuidMatch = sessionId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        if (uuidMatch && uuidMatch[1]) {
          clientRequestId = uuidMatch[1];
          console.log(`Extracted UUID ${clientRequestId} from URN ${sessionId}`);
        }
      }

      const requestPayload = {
        api_key_id: IDMISSION_KEY_ID,
        signature: signature,
        timestamp: timestamp,
        client_request_id: clientRequestId,
        // Try both the client request ID and the known form ID
        form_id: clientRequestId,
      };

      console.log(`Sending request to validate-id-match-face API with client_request_id: ${sessionId}`);

      const response = await axios({
        method: "post",
        url: "https://portal-api.idmission.com/portal.verification.v1.VerificationService/GetVerificationResult",
        data: requestPayload,
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: function (status) {
          return true; // Accept any status code
        },
      });

      if (response.status === 200) {
        console.log(`Successfully fetched verification data from IDMission API for session: ${sessionId}`);

        // Store the API response data in our message store
        const apiData = response.data;
        await messageStore.addMessage(sessionId, "idmission_verification_result", {
          timestamp: new Date().toISOString(),
          status: apiData.status?.statusMessage || "unknown",
          statusCode: apiData.status?.statusCode || "unknown",
          resultData: apiData.resultData || {},
          customerData: apiData.responseCustomerData || {},
          rawResponse: apiData,
        });

        // If a form ID was provided, store the data under that ID as well
        if (requestPayload.form_id && requestPayload.form_id !== sessionId) {
          await messageStore.addMessage(requestPayload.form_id, "idmission_verification_result", {
            timestamp: new Date().toISOString(),
            status: apiData.status?.statusMessage || "unknown",
            statusCode: apiData.status?.statusCode || "unknown",
            resultData: apiData.resultData || {},
            customerData: apiData.responseCustomerData || {},
            rawResponse: apiData,
          });
        }

        return {
          success: true,
          data: apiData,
          fromApi: true,
          apiTimestamp: new Date().toISOString(),
        };
      } else {
        console.log(`Failed to fetch verification data from IDMission API: ${response.status}`);
        console.log(`API response: ${JSON.stringify(response.data)}`);
      }
    } catch (apiError) {
      console.error("Error fetching verification data from IDMission API:", apiError);
    }

    // If we get here, we couldn't get data from either webhook or API
    return {
      success: false,
      webhookPreferred: true,
      error: "Verification data not found. Please complete verification or check session ID.",
      message: "Please complete the verification process. Results will be available when verification is complete.",
    };
  } catch (error: any) {
    console.error("Error retrieving IDMission verification results:", error);
    return {
      success: false,
      error: error.message || "Unknown error retrieving verification results",
      webhookPreferred: true,
    };
  }
}

/**
 * Process webhook data from IDMission
 *
 * @param sessionId The IDMission session ID
 * @param webhookData The data received from IDMission webhook
 * @returns Result of storing the webhook data
 */
export async function processWebhook(sessionId: string, webhookData: any) {
  try {
    console.log(`Processing IDMission webhook data for session: ${sessionId}`);

    // Store the webhook data in our message store
    await messageStore.addMessage(sessionId, "idmission_verification_result", webhookData);

    console.log(`Successfully stored IDMission verification data for session: ${sessionId}`);

    return {
      success: true,
      message: "Webhook data processed successfully",
      sessionId,
    };
  } catch (error: any) {
    console.error(`Error processing IDMission webhook:`, error);
    return {
      success: false,
      error: error.message,
      sessionId,
    };
  }
}

/**
 * Handle webhook notifications from IDMission
 *
 * This function processes webhook data from IDMission and stores it in our message store
 * for real-time verification status updates
 *
 * @param webhookData The data received from IDMission webhook
 * @returns Result of processing the webhook data
 */
export async function handleWebhook(webhookData: any) {
  try {
    // Extract session ID from the webhook data
    const sessionId =
      webhookData.sessionId ||
      webhookData.Client_Request_ID ||
      webhookData.uniqueRequestId ||
      webhookData.transactionId;

    if (!sessionId) {
      console.error("No session ID found in webhook data");
      return {
        success: false,
        error: "Missing session ID in webhook data",
      };
    }

    console.log(`Processing IDMission webhook for session ID: ${sessionId}`);

    // Log verification status details if available
    if (webhookData.verificationStatus || webhookData.status || webhookData.scanStatus) {
      console.log("IDMission verification status details:", {
        status: webhookData.status || "not provided",
        verificationStatus: webhookData.verificationStatus || "not provided",
        scanStatus: webhookData.scanStatus || "not provided",
        passed: webhookData.passed !== undefined ? webhookData.passed : "not provided",
        responseCode: webhookData.responseCode || "not provided",
        responseMessage: webhookData.responseMessage || "not provided",
        hasIdData: !!webhookData.idData,
      });
    }

    // Store the webhook data in our message store
    const message = await messageStore.addMessage(sessionId, "idmission_verification_result", {
      timestamp: new Date().toISOString(),
      status: webhookData.status || webhookData.verificationStatus || "unknown",
      verificationData: webhookData,
      rawResponse: webhookData,
    });

    console.log(`Successfully processed and stored IDMission webhook data for session: ${sessionId}`);

    return {
      success: true,
      message: "Webhook data processed successfully",
      sessionId,
      messageId: message.id,
    };
  } catch (error: any) {
    console.error(`Error handling IDMission webhook:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}
