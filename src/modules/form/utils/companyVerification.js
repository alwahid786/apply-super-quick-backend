import { getEnv } from "../../../configs/config.js";

import { promisify } from "util";
import { lookup } from "dns";

const lookupAsync = promisify(lookup);

// VERIFY COMPANY
// --------------
export async function verifyCompanyInformation(name, url) {
  const apiKey = getEnv("GOOGLE_SEARCH_API_KEY");
  const searchEngineId = getEnv("GOOGLE_SEARCH_ENGINE_ID");

  console.log("api keys", apiKey, searchEngineId);

  if (!apiKey || !searchEngineId) {
    return {
      originalCompanyName: name,
      originalUrl: url,
      verificationStatus: "api_error",
      error: "Google Search API credentials not configured",
    };
  }

  // Both company name and URL are required for verification
  if (!name || !url) {
    return {
      originalCompanyName: name,
      originalUrl: url,
      verificationStatus: "unverified",
      error: "Both company name and website URL are required for verification",
    };
  }

  try {
    // Enhanced URL validation pipeline
    const urlValidation = await validateUrlComprehensively(url);

    // console.log("urlValidation", urlValidation);
    if (!urlValidation.isValid) {
      return {
        originalCompanyName: name,
        originalUrl: url,
        verificationStatus: "unverified",
        error: `URL validation failed: ${urlValidation?.reason}`,
      };
    }

    // Extract domain for site search
    const domain = new URL(urlValidation?.formattedUrl)?.hostname.replace("www.", "");

    // Normalize company name for better search matching
    const { coreNormalized } = normalizeCompanyName(name);

    // Search 1: Normalized company name + website keywords
    const companyQuery = `"${coreNormalized}" website`;
    const companySearchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(
      companyQuery
    )}&num=5`;

    // Search 2: Site-specific search for company information
    const siteQuery = `site:${domain} company OR about`;
    const siteSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(
      siteQuery
    )}&num=5`;

    const [companyData, siteData] = await Promise.all([
      fetchWithStabilization(companySearchUrl),
      fetchWithStabilization(siteSearchUrl),
    ]);

    // Calculate confidence score using dual search results
    const verificationResult = calculateVerificationScore(
      coreNormalized, // Use normalized company name for consistent scoring
      url,
      companyData?.items || [],
      siteData?.items || []
    );

    return {
      originalCompanyName: name,
      originalUrl: url,
      verificationStatus: verificationResult.status,
      confidenceScore: verificationResult.confidenceScore,
      evidence: verificationResult.evidence,
      error: verificationResult.error,
    };
  } catch (error) {
    console.log("Error in verifyCompanyInformation:", error);
    return {
      originalCompanyName: name,
      originalUrl: url,
      verificationStatus: "api_error",
      error: "Verification service temporarily unavailable",
    };
  }
}

// VALIDATE URL
// --------------
export async function validateUrlComprehensively(websiteUrl) {
  let formattedUrl = websiteUrl;

  // Step 1: Basic URL format validation (already done by Zod, but ensure proper format)
  try {
    const url = new URL(websiteUrl);
    formattedUrl = url.toString();
  } catch (error) {
    return {
      isValid: false,
      reason: "Invalid URL format",
      formattedUrl: websiteUrl,
      businessScore: 0,
      parkingScore: 0,
    };
  }

  // Step 2: DNS Domain Validation
  const hostname = new URL(formattedUrl).hostname;

  try {
    await lookupAsync(hostname);
  } catch (dnsError) {
    return {
      isValid: false,
      reason: `Domain "${hostname}" does not exist or is not accessible`,
      formattedUrl,
      businessScore: 0,
      parkingScore: 0,
    };
  }

  // Step 3: HTTP Response Validation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let response;
  try {
    response = await fetch(formattedUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: controller.signal,
      redirect: "follow",
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);
    return {
      isValid: false,
      reason: `Website is not accessible: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
      formattedUrl,
      businessScore: 0,
      parkingScore: 0,
    };
  } finally {
    clearTimeout(timeoutId);
  }

  // Accept valid responses (2xx, 3xx) and bot protection (403, 429)
  if (!((response.status >= 200 && response.status < 400) || response.status === 403 || response.status === 429)) {
    return {
      isValid: false,
      reason: `Website returned HTTP ${response.status}`,
      formattedUrl,
      businessScore: 0,
      parkingScore: 0,
    };
  }

  // Step 4: Content Type Validation
  console.log(`🔍 [STEP 4] Checking content type...`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    console.log(`❌ [STEP 4] Non-HTML content type: ${contentType}`);
    return {
      isValid: false,
      reason: "Website does not return HTML content",
      formattedUrl,
      businessScore: 0,
      parkingScore: 0,
    };
  }

  console.log(`✅ [STEP 4] Content type is HTML`);

  // Step 5: Business Legitimacy Analysis
  console.log(`🔍 [STEP 5] Analyzing business legitimacy...`);
  let html = "";
  try {
    html = await response.text();
    html = html.toLowerCase(); // Case-insensitive matching
    console.log(`📄 [STEP 5] Retrieved ${html.length} characters of HTML content`);
  } catch (textError) {
    console.log(`⚠️ [STEP 5] Could not read HTML content, but got valid response - considering valid`);
    return {
      isValid: true,
      formattedUrl,
      businessScore: 0,
      parkingScore: 0,
    };
  }

  // Business Indicators (positive scoring)
  const businessIndicators = [
    "about us",
    "contact us",
    "services",
    "products",
    "our team",
    "privacy policy",
    "terms of service",
    "careers",
    "support",
    "solutions",
    "portfolio",
    "testimonials",
    "clients",
    "company",
    "business",
    "enterprise",
    "corporation",
  ];

  // Parking Page Indicators (negative scoring)
  const parkingIndicators = [
    "domain for sale",
    "buy this domain",
    "purchase this domain",
    "under construction",
    "coming soon",
    "site maintenance",
    "default page",
    "apache test page",
    "nginx default",
    "parked domain",
    "domain parking",
    "this domain is for sale",
    "domain expired",
    "suspended domain",
  ];

  let businessScore = 0;
  let parkingScore = 0;

  // Count business indicators
  console.log(`🔍 [SCORING] Checking for business indicators...`);
  for (const indicator of businessIndicators) {
    if (html.includes(indicator)) {
      businessScore++;
      console.log(`  ✅ Found business indicator: "${indicator}"`);
    }
  }

  // Count parking indicators
  console.log(`🔍 [SCORING] Checking for parking indicators...`);
  for (const indicator of parkingIndicators) {
    if (html.includes(indicator)) {
      parkingScore++;
      console.log(`  ❌ Found parking indicator: "${indicator}"`);
    }
  }

  // Check for phone numbers and emails as business indicators
  const phoneRegex = /(\(?\d{3}\)?\s?[-.]?\s?\d{3}[-.]?\s?\d{4})/g;
  const emailRegex = /\b[\w\.-]+@[\w\.-]+\.\w+\b/g;

  if (phoneRegex.test(html)) {
    businessScore++;
    console.log(`  ✅ Found phone number(s)`);
  }
  if (emailRegex.test(html)) {
    businessScore++;
    console.log(`  ✅ Found email address(es)`);
  }

  console.log(`📊 [SCORING] Final scores - Business: ${businessScore}, Parking: ${parkingScore}`);

  // Rejection Logic
  let isValid = true;
  let reason = "";

  if (parkingScore >= 3) {
    isValid = false;
    reason = "Website appears to be a parked domain";
  } else if (parkingScore >= 2 && businessScore < 3) {
    isValid = false;
    reason = "Parking indicators outweigh business indicators";
  } else if (parkingScore >= 1 && businessScore < 1) {
    isValid = false;
    reason = "Parking indicators with no business indicators";
  }

  if (!isValid) {
    console.log(`❌ [STEP 5] Legitimacy check failed: ${reason}`);
  } else {
    console.log(`✅ [STEP 5] Business legitimacy check passed`);
  }

  return {
    isValid,
    reason: isValid ? undefined : reason,
    formattedUrl,
    businessScore,
    parkingScore,
  };
}

const ENTITY_DESIGNATIONS = [
  // United States
  "inc.",
  "inc",
  "incorporated",
  "llc",
  "l.l.c.",
  "pc",
  "p.c.",
  "pllc",
  "p.l.l.c.",
  "lp",
  "l.p.",
  "llp",
  "l.l.p.",
  "gp",
  "g.p.",
  "pa",
  "p.a.",
  "jv",
  "j.v.",
  "l3c",
  "l.3.c.",
  "rlllp",
  "r.l.l.l.p.",

  // International - Common across multiple countries
  "ltd",
  "ltd.",
  "limited",
  "corp.",
  "corp",
  "corporation",
  "co.",
  "co",
  "company",

  // Canada
  "ltee",
  "ltée",

  // United Kingdom
  "plc",
  "public limited company",
  "cic",
  "community interest company",

  // Australia
  "pty ltd",
  "pty. ltd.",
  "proprietary limited",
  "pty",
  "proprietary",
  "no liability",
  "nl",

  // India & Pakistan
  "pvt ltd",
  "pvt. ltd.",
  "private limited",

  // Singapore
  "pte ltd",
  "pte. ltd.",

  // South Africa
  "cc",
  "close corporation",

  // Hong Kong
  "co ltd",
  "co. ltd.",
  "company limited",

  // Nigeria
  "rc",
  "registered company",
];
// normalize name
// --------------
export function normalizeCompanyName(companyName) {
  const fullNormalized = companyName.toLowerCase().trim();
  let coreNormalized = fullNormalized;

  // Remove each entity designation from the end of the string
  ENTITY_DESIGNATIONS.forEach((designation) => {
    // Create regex patterns to match different formats:
    // 1. ", Inc." (with comma and space)
    // 2. " Inc." (with space only)
    // 3. "Inc." (direct attachment)
    const patterns = [
      new RegExp(`,\\s*${designation.replace(/\./g, "\\.")}$`),
      new RegExp(`\\s+${designation.replace(/\./g, "\\.")}$`),
      new RegExp(`${designation.replace(/\./g, "\\.")}$`),
    ];

    patterns.forEach((pattern) => {
      coreNormalized = coreNormalized.replace(pattern, "");
    });
  });

  // Clean up any trailing commas or whitespace
  coreNormalized = coreNormalized.trim().replace(/,\s*$/, "");

  return {
    fullNormalized,
    coreNormalized,
  };
}

// fetch with stabilizer
// ---------------------
export async function fetchWithStabilization(url) {
  let previousFirstItem = null;
  let stableCount = 0;
  const requiredStableIterations = 3; // Require 3 consecutive stable responses
  let iteration = 0;

  while (stableCount < requiredStableIterations && iteration < 10) {
    // Max 10 iterations (500ms max delay)
    iteration++;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const currentFirstItem = data.items?.[0];

    if (currentFirstItem) {
      // Compare with previous iteration
      if (
        previousFirstItem &&
        currentFirstItem.title === previousFirstItem.title &&
        currentFirstItem.link === previousFirstItem.link
      ) {
        stableCount++;
      } else {
        stableCount = 0; // Reset if response changed
      }

      previousFirstItem = currentFirstItem;
    } else {
      stableCount = 0;
    }

    // If not stable yet, wait 50ms before next attempt
    if (stableCount < requiredStableIterations && iteration < 10) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  // Make final request to get the data
  const finalResponse = await fetch(url);
  if (!finalResponse.ok) {
    throw new Error(`Google Search API error: ${finalResponse.status} ${finalResponse.statusText}`);
  }

  return await finalResponse.json();
}

// calculate verification score
// ----------------------------
export function calculateVerificationScore(companyName, websiteUrl, companySearchResults, siteSearchResults) {
  const domain = new URL(websiteUrl).hostname.replace("www.", "");
  // STEP 1: Company Name Normalization
  const { fullNormalized, coreNormalized } = normalizeCompanyName(companyName);

  let score = 0;
  const companyEvidence = [];
  const siteEvidence = [];

  // Score company search results (looking for domain mentions)
  companySearchResults.forEach((item, index) => {
    const title = (item.title || "").toLowerCase();
    const snippet = (item.snippet || "").toLowerCase();
    const link = (item.link || "").toLowerCase();

    let itemScore = 0;

    // Direct domain match in link (highest confidence)
    if (link.includes(domain)) {
      itemScore += 40;
      companyEvidence.push(`Domain "${domain}" found in search result`);
    }

    // Company name + domain in same result (try both full and core name)
    const hasCompanyNameMatch =
      title.includes(fullNormalized) ||
      snippet.includes(fullNormalized) ||
      title.includes(coreNormalized) ||
      snippet.includes(coreNormalized);
    const hasDomainMatch = title.includes(domain) || snippet.includes(domain);

    if (hasCompanyNameMatch && hasDomainMatch) {
      itemScore += 30;
      companyEvidence.push(`Company name and domain found together`);
    }

    // Domain mentioned in title/snippet
    if (title.includes(domain) || snippet.includes(domain)) {
      itemScore += 20;
      companyEvidence.push(`Domain mentioned in content`);
    }

    score += itemScore;
  });

  // Score site search results (looking for company name mentions)
  siteSearchResults.forEach((item, index) => {
    const title = (item.title || "").toLowerCase();
    const snippet = (item.snippet || "").toLowerCase();

    let itemScore = 0;

    // Company name match (try both full and core name)
    const hasFullMatch = title.includes(fullNormalized) || snippet.includes(fullNormalized);
    const hasCoreMatch = title.includes(coreNormalized) || snippet.includes(coreNormalized);

    if (hasFullMatch || hasCoreMatch) {
      itemScore += 35;
      const matchType = hasFullMatch ? "full" : "core";
      siteEvidence.push(`Company name (${matchType}) found on website`);
    }

    // Partial company name match (for multi-word company names) - use core normalized
    const companyWords = coreNormalized.split(" ").filter((word) => word.length > 2);
    const matchedWords = companyWords.filter((word) => title.includes(word) || snippet.includes(word));

    if (matchedWords.length > 0 && matchedWords.length < companyWords.length) {
      const partialScore = (matchedWords.length / companyWords.length) * 15;
      itemScore += partialScore;
      siteEvidence.push(`Partial company name match (${matchedWords.length}/${companyWords.length} words)`);
    }

    score += itemScore;
  });

  // Smart confidence scoring with multiple verification pathways
  let confidenceScore;
  let verificationPath;

  // Path 1: Strong site presence (company name found on their own website)
  const siteNameMatches = siteEvidence.filter((e) => e.includes("Company name")).length;
  if (siteNameMatches >= 2) {
    // Multiple pages on the site contain the company name - very strong signal
    confidenceScore = Math.min(85 + siteNameMatches * 5, 95);
    verificationPath = "Strong site presence";
  } else if (siteNameMatches >= 1) {
    // At least one page contains the company name - good signal
    confidenceScore = Math.min(75 + score * 0.1, 85);
    verificationPath = "Site presence with cross-reference";
  } else {
    // Traditional scoring - need cross-references
    const maxPossibleScore = 150;
    confidenceScore = Math.min(Math.round((score / maxPossibleScore) * 100), 100);
    verificationPath = "Cross-reference verification";
  }

  let status;
  let error;

  if (confidenceScore >= 60) {
    status = "verified";
  } else {
    status = "unverified";
    error = `Unable to verify this company matches this website (confidence: ${confidenceScore}%)`;
  }

  return {
    status,
    confidenceScore,
    evidence: {
      companySearchResults: companyEvidence,
      siteSearchResults: siteEvidence,
    },
    error,
  };
}
