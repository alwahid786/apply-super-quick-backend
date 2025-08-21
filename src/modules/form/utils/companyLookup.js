import * as cheerio from "cheerio";
import { getEnv } from "../../../configs/config.js";
import Prompt from "../schemas/prompts.model.js";
import SearchStrategy from "../schemas/searchStrategies.model.js";
import { normalizeCompanyName } from "./companyVerification.js";

export async function executeCompanyLookup(companyName, websiteUrl, userId) {
  const startTime = Date.now();
  const normalizedName = normalizeCompanyName(companyName);
  const domain = websiteUrl ? new URL(websiteUrl).hostname.replace("www.", "") : "";

  console.log(`🔍 [STEP2-LOOKUP] Starting comprehensive data collection for: ${companyName}`);
  console.log(`🎯 [STEP2-LOOKUP] Process: Google searches + multi-page website scraping → AI extraction`);

  // Load dynamic search strategies from database
  const searchStrategies = await SearchStrategy.find({ owner: userId });
  const searches = {};

  console.log(`📋 [STEP2-DATABASE] Loaded ${searchStrategies?.length} configurable search strategies from database`);

  for (const strategy of searchStrategies) {
    // Skip strategies with empty search terms
    if (!strategy?.searchTerms || strategy?.searchTerms.trim() === "") {
      continue;
    }

    // Build dynamic search query based on company identification selections
    const companyIdentification = strategy?.companyIdentification || [];
    let companyPrefix = "";

    if (companyIdentification?.length === 0 || companyIdentification?.includes("None")) {
      // If no company identification selected or "None" is selected, use only search terms
      companyPrefix = "";
    } else {
      // Build company identification components based on selections
      const identificationComponents = [];

      if (companyIdentification?.includes("Simple company name")) {
        identificationComponents.push(normalizedName?.coreNormalized);
      }
      if (companyIdentification.includes("Legal company name")) {
        identificationComponents.push(normalizedName?.fullNormalized);
      }
      if (companyIdentification.includes("Website URL") && domain) {
        identificationComponents.push(domain);
      }

      // Join components with " OR " and add space before search terms
      companyPrefix = identificationComponents.length > 0 ? identificationComponents.join(" OR ") + " " : "";
    }

    const companyQuery = `${companyPrefix}${strategy?.searchTerms}`;
    searches[strategy?.searchObjectKey] = companyQuery;

    console.log(`🔍 [QUERY-BUILD] ${strategy.searchObjectKey}: "${companyQuery}"`);
    console.log(`📋 [IDENTIFICATION] Company ID selections: [${companyIdentification.join(", ")}]`);
  }

  try {
    // Execute only active searches in parallel for optimal performance
    const activeSearches = Object.entries(searches).filter(([searchKey]) => {
      const strategy = searchStrategies?.find((s) => s?.searchObjectKey === searchKey);
      return strategy?.isActive ?? false;
    });

    // Start comprehensive website scraping in parallel with Google searches
    let websiteScrapingPromise;
    if (websiteUrl) {
      console.log(`🕷️ [WEBSITE-SCRAPING] Starting website scraping for: ${websiteUrl}`);
      websiteScrapingPromise = scrapeCompanyWebsite(websiteUrl);
    } else {
      console.log(`⚠️ [WEBSITE-SCRAPING] No website URL provided, skipping scraping`);
      websiteScrapingPromise = Promise.resolve(null);
    }

    const searchPromises = activeSearches.map(async ([searchType, query]) => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${getEnv("GOOGLE_SEARCH_API_KEY")}&cx=${getEnv(
            "GOOGLE_SEARCH_ENGINE_ID"
          )}&q=${encodeURIComponent(query)}&num=10`
        );

        if (!response?.ok) {
          throw new Error(`Search API error: ${response?.status}`);
        }

        const data = await response.json();

        return {
          searchType: searchType,
          results: data.items || [],
          query,
        };
      } catch (error) {
        return {
          searchType: searchType,
          results: [],
          query,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    let searchResults, websiteScrapingResult;

    try {
      console.log(`⏳ [STEP2-AWAIT] Waiting for Google searches and website scraping to complete...`);
      [searchResults, websiteScrapingResult] = await Promise.all([Promise.all(searchPromises), websiteScrapingPromise]);
      console.log(`✅ [STEP2-AWAIT] Both Google searches and website scraping completed successfully`);
    } catch (error) {
      console.error(`❌ [STEP2-AWAIT] Error in Promise.all:`, error);
      throw error;
    }

    // Log website scraping result
    console.log(`🔍 [STEP2-DEBUG] Processing website scraping result...`);
    if (websiteScrapingResult) {
      console.log(`🕷️ [WEBSITE-SCRAPING] Scraping completed. Success: ${websiteScrapingResult.success}`);
      if (websiteScrapingResult.success) {
        console.log(`📊 [WEBSITE-SCRAPING] Content length: ${websiteScrapingResult.contentLength} characters`);
      } else {
        console.log(`❌ [WEBSITE-SCRAPING] Error: ${websiteScrapingResult.error}`);
      }
    } else {
      console.log(`🕷️ [WEBSITE-SCRAPING] No scraping attempted (websiteScrapingResult is null)`);
    }

    console.log(
      `🚨 [CRITICAL] About to start search evidence processing - if this is the last log, there's an exception!`
    );

    // First, let's validate what we got from Promise.all
    console.log(`🔍 [DEBUG-PROMISE ALL] Promise.all results validation:`);
    console.log(`  - searchResults type: ${typeof searchResults}`);
    console.log(`  - searchResults length: ${Array.isArray(searchResults) ? searchResults.length : "not array"}`);
    console.log(`  - websiteScrapingResult type: ${typeof websiteScrapingResult}`);

    if (Array.isArray(searchResults)) {
      console.log(`🔍 [DEBUG-PROMISE ALL] Search results structure:`);
      searchResults.forEach((result, index) => {
        console.log(
          `    [${index}] searchType: ${result?.searchType}, results: ${
            result?.results?.length || 0
          }, hasQuery: ${!!result?.query}`
        );
      });
    }

    // Store search results for Gemini AI extraction
    console.log(`📋 [CHECKPOINT-1] Starting search evidence processing...`);
    let searchEvidence = {};

    try {
      console.log(`📋 [CHECKPOINT-1A] Creating searchEvidence object...`);
      searchEvidence = {};

      // Process search results and prepare evidence in structured table format
      console.log(`🔍 [CHECKPOINT-2] Processing ${searchResults.length} Google search result sets...`);
      for (let i = 0; i < searchResults.length; i++) {
        const searchResult = searchResults[i];
        console.log(`  📊 [SEARCH-PROCESSING] Processing result ${i + 1}/${searchResults.length}`);

        try {
          console.log(`    🔍 [SEARCH-DETAIL] Destructuring result ${i + 1}...`);
          const { searchType, results, query } = searchResult;
          console.log(`    🔍 [SEARCH-DETAIL] searchType: ${searchType}, results: ${results?.length || 0}`);

          const strategy = searchStrategies.find((s) => s.searchObjectKey === searchType);
          const strategyName = strategy?.searchObjectKey || searchType;
          const targetFields = strategy?.extractAs ? [strategy.extractAs] : [];

          // Store search results in structured table format
          if (results && results.length > 0) {
            console.log(`    🔍 [SEARCH-DETAIL] Formatting ${results.length} results for ${searchType}...`);
            const formattedResults = formatSearchResultsAsTable(
              results.slice(0, 10),
              strategyName,
              query,
              targetFields
            );
            console.log(`    🔍 [SEARCH-DETAIL] Adding formatted results to searchEvidence...`);
            searchEvidence[searchType] = [formattedResults];
            console.log(`    ✅ [SEARCH-PROCESSING] Successfully added ${searchType} to search evidence`);
          } else {
            console.log(`    ⚠️ [SEARCH-PROCESSING] Skipped ${searchType} (no results)`);
          }
        } catch (resultError) {
          console.error(`    ❌ [SEARCH-PROCESSING] Error processing result ${i + 1}:`, resultError);
          console.error(`    ❌ [SEARCH-PROCESSING] Result structure:`, JSON.stringify(searchResult, null, 2));
        }
      }
      console.log(
        `✅ [CHECKPOINT-3] Google search evidence processing complete. Evidence entries: ${
          Object.keys(searchEvidence).length
        }`
      );

      // Add website content to search evidence if scraping was successful
      console.log(`🔍 [CHECKPOINT-4] Starting website content processing...`);
      console.log(`🔍 [DEBUG] websiteScrapingResult validation:`);
      console.log(`  - Exists: ${!!websiteScrapingResult}`);
      console.log(`  - Success: ${websiteScrapingResult?.success}`);
      console.log(`  - Has content: ${!!websiteScrapingResult?.content}`);
      console.log(`  - Content type: ${typeof websiteScrapingResult?.content}`);
      console.log(`  - Content length: ${websiteScrapingResult?.contentLength}`);

      if (websiteScrapingResult?.content) {
        console.log(`  - Content preview: ${websiteScrapingResult.content.substring(0, 100)}...`);
      }

      if (websiteScrapingResult?.success && websiteScrapingResult.content) {
        console.log(`✅ [CHECKPOINT-5] Condition passed - adding website content to search evidence`);
        try {
          // 🔍 TRACE STEP 2: Before formatting
          console.log(`🔍 [TRACE-2] BEFORE formatWebsiteContentWithURLAttributions`);
          console.log(`🔍 [TRACE-2] websiteScrapingResult.content.length: ${websiteScrapingResult.content.length}`);
          console.log(`🔍 [TRACE-2] First 200 chars: ${websiteScrapingResult.content.substring(0, 200)}`);
          console.log(
            `🔍 [TRACE-2] Contains 'Scott Agatep': ${websiteScrapingResult.content.includes("Scott Agatep")}`
          );
          console.log(
            `🔍 [TRACE-2] Contains 'Strategic Advisers': ${websiteScrapingResult.content.includes(
              "Strategic Advisers"
            )}`
          );

          // Format website content with URL-based source attributions
          const websiteContentWithURLAttributions = formatWebsiteContentWithURLAttributions(
            websiteScrapingResult.content
          );

          // 🔍 TRACE STEP 3: After formatting
          console.log(`🔍 [TRACE-3] AFTER formatWebsiteContentWithURLAttributions`);
          console.log(
            `🔍 [TRACE-3] websiteContentWithURLAttributions.length: ${websiteContentWithURLAttributions.length}`
          );
          console.log(`🔍 [TRACE-3] First 200 chars: ${websiteContentWithURLAttributions.substring(0, 200)}`);
          console.log(
            `🔍 [TRACE-3] Contains 'Scott Agatep': ${websiteContentWithURLAttributions.includes("Scott Agatep")}`
          );
          console.log(
            `🔍 [TRACE-3] Contains 'Strategic Advisers': ${websiteContentWithURLAttributions.includes(
              "Strategic Advisers"
            )}`
          );

          const websiteContentFormatted = `WEBSITE CONTENT EVIDENCE
Content Length: ${websiteScrapingResult.contentLength} characters

${websiteContentWithURLAttributions}`;

          // 🔍 TRACE STEP 4: After final formatting
          console.log(`🔍 [TRACE-4] AFTER FINAL FORMATTING`);
          console.log(`🔍 [TRACE-4] websiteContentFormatted.length: ${websiteContentFormatted.length}`);
          console.log(`🔍 [TRACE-4] First 200 chars: ${websiteContentFormatted.substring(0, 200)}`);
          console.log(`🔍 [TRACE-4] Contains 'Scott Agatep': ${websiteContentFormatted.includes("Scott Agatep")}`);
          console.log(
            `🔍 [TRACE-4] Contains 'Strategic Advisers': ${websiteContentFormatted.includes("Strategic Advisers")}`
          );

          searchEvidence["websiteContent"] = [websiteContentFormatted];
          console.log(
            `✅ [SEARCH-EVIDENCE] Website content successfully added with URL-based source attributions. Total search evidence entries: ${
              Object.keys(searchEvidence).length
            }`
          );
          console.log(`✅ [CHECKPOINT-6] Website content integration complete`);
        } catch (error) {
          console.error(`❌ [SEARCH-EVIDENCE] Error adding website content:`, error);
        }
      } else {
        console.log(`⚠️ [CHECKPOINT-5] Condition failed - website content NOT added`);
        console.log(`  - websiteScrapingResult?.success: ${websiteScrapingResult?.success}`);
        console.log(`  - websiteScrapingResult.content: ${!!websiteScrapingResult?.content}`);
      }
    } catch (searchEvidenceError) {
      console.error(`❌ [SEARCH-EVIDENCE-ERROR] Exception in search evidence processing:`, searchEvidenceError);
      console.error(
        `❌ [SEARCH-EVIDENCE-ERROR] Error stack:`,
        searchEvidenceError instanceof Error ? searchEvidenceError.stack : "No stack"
      );
      throw searchEvidenceError; // Re-throw to trigger outer catch
    }

    // Prepare search results array from search evidence
    console.log(`🔍 [CHECKPOINT-7] Building final search results array...`);
    const searchResultsArray = [];
    console.log(
      `📋 [SEARCH-EVIDENCE] Building search results array from ${Object.keys(searchEvidence).length} evidence entries:`
    );

    for (const [searchType, results] of Object.entries(searchEvidence)) {
      console.log(`  - ${searchType}: ${results?.length || 0} results`);
      if (results && results.length > 0) {
        searchResultsArray.push(...results);
        console.log(`    ✅ Added ${results.length} items from ${searchType}`);
      }
    }

    console.log(`📋 [SEARCH-EVIDENCE] Final search results array has ${searchResultsArray.length} total items`);

    // Check if website content made it into the final array
    const hasWebsiteContent = searchResultsArray.some((result) => result.includes("WEBSITE CONTENT EVIDENCE"));
    console.log(`🔍 [SEARCH-EVIDENCE] Website content in final array: ${hasWebsiteContent}`);

    if (hasWebsiteContent) {
      const websiteIndex = searchResultsArray.findIndex((result) => result.includes("WEBSITE CONTENT EVIDENCE"));
      console.log(`✅ [CHECKPOINT-8] Website content found at array index ${websiteIndex}`);
    } else {
      console.log(`❌ [CHECKPOINT-8] Website content NOT found in final array`);
      console.log(`🔍 [DEBUG] Search evidence keys: ${Object.keys(searchEvidence).join(", ")}`);
      console.log(
        `🔍 [DEBUG] Array item previews:`,
        searchResultsArray.map((item, i) => `${i}: ${item.substring(0, 50)}...`)
      );
    }

    // Build full extraction prompt from database prompt sections (only system_context and extraction_task)
    const promptSections = await Prompt.find({ owner: userId });
    console.log(`🔍 [PROMPT-DEBUG] Retrieved ${promptSections?.length} prompt sections`);

    const filteredPrompt = promptSections
      .filter((doc) => {
        // Only include system_context and extraction_task sections for manual experimentation
        const allowedSections = ["system_context", "extraction_task"];
        return allowedSections.includes(doc.name);
      })
      .sort((a, b) => Number(a.section) - Number(b.section))
      .map((doc) => doc.prompt)
      .join("\n\n");

    console.log(`🔍 [PROMPT-DEBUG] Filtered prompt length: ${filteredPrompt.length} characters`);

    const fullPrompt = filteredPrompt;

    // 🚨 SAVE SEARCH EVIDENCE TO FILE FOR ANALYSIS
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `search-evidence-${timestamp}.txt`;

      let fileContent = "=".repeat(80) + "\n";
      fileContent += "SEARCH EVIDENCE ANALYSIS FILE\n";
      fileContent += "=".repeat(80) + "\n";
      fileContent += `Generated: ${new Date().toISOString()}\n`;
      fileContent += `Company: ${companyName}\n`;
      fileContent += `Website: ${websiteUrl || "Not provided"}\n`;
      fileContent += `Total search evidence entries: ${Object.keys(searchEvidence).length}\n`;
      fileContent += `Final search results array length: ${searchResultsArray.length}\n`;
      fileContent += `Website scraping success: ${websiteScrapingResult?.success}\n`;
      fileContent += `Website content length: ${websiteScrapingResult?.contentLength || 0} characters\n`;
      fileContent += "=".repeat(80) + "\n\n";

      fileContent += "EXACT DATA SENT TO GEMINI AI:\n";
      fileContent += "-".repeat(40) + "\n";
      fileContent += "PROMPT:\n";
      fileContent += fullPrompt + "\n\n";
      fileContent += "-".repeat(40) + "\n";
      fileContent += "SEARCH RESULTS ARRAY:\n";
      fileContent += "-".repeat(40) + "\n";
      searchResultsArray.forEach((item, index) => {
        fileContent += `\n--- ITEM ${index + 1} (${item.length} characters) ---\n`;
        fileContent += item + "\n";
      });

      fileContent += "\n" + "=".repeat(80) + "\n";
      fileContent += `TOTAL FILE SIZE: ${fileContent.length} characters\n`;
      fileContent += "=".repeat(80) + "\n";

      // Write to file
      const fs = await import("fs");
      const path = await import("path");
      const filepath = path.join(process.cwd(), filename);
      fs.writeFileSync(filepath, fileContent, "utf8");

      console.log(`💾 [FILE-SAVED] Search evidence saved to: ${filename}`);
      console.log(`💾 [FILE-SAVED] File size: ${fileContent.length} characters`);
      console.log(`💾 [FILE-SAVED] Search evidence entries: ${Object.keys(searchEvidence).length}`);
      console.log(`💾 [FILE-SAVED] Final array items: ${searchResultsArray.length}`);
    } catch (fileError) {
      console.error(`❌ [FILE-ERROR] Failed to save search evidence:`, fileError);
    }

    console.log(`🔍 [PRE-EXTRACTION] About to start extraction process`);
    console.log(`🔍 [PRE-EXTRACTION] fullPrompt exists: ${!!fullPrompt}`);
    console.log(`🔍 [PRE-EXTRACTION] searchResultsArray length: ${searchResultsArray.length}`);
    console.log(`🔍 [PRE-EXTRACTION] searchStrategies length: ${searchStrategies.length}`);

    try {
      console.log(`🔍 [STEP2→STEP3] Starting AI extraction with ${searchResultsArray.length} search results`);
      console.log(`🔍 [STEP2→STEP3] Active strategies: ${searchStrategies.filter((s) => s.isActive).length}`);
      console.log(`🔍 [STEP2→STEP3] Full prompt length: ${fullPrompt.length} characters`);

      const extractionResult = await extractDataFromSearchResults(
        searchResultsArray,
        searchStrategies.filter((s) => s.isActive), // Only pass active search strategies
        fullPrompt
      );

      console.log(`🔍 [STEP2→STEP3] Extraction completed. Success: ${extractionResult.success}`);
      console.log(`🔍 [STEP2→STEP3] Confidence score: ${extractionResult.confidenceScore}`);
      console.log(`🔍 [STEP2→STEP3] Extracted fields: ${Object.keys(extractionResult.extractedData).length}`);

      return {
        status: extractionResult.success ? "success" : "failed",
        collectedData: extractionResult.extractedData,
        collectionRate: extractionResult.confidenceScore,
        searchEvidence,
        websiteContent: websiteScrapingResult?.content,
        websiteContentLength: websiteScrapingResult?.contentLength,
        apiCallsUsed: searchResults.length + 1, // Google + 1 Gemini API call
        processingTime: Date.now() - startTime,
      };
    } catch (extractionError) {
      console.error(`❌ [STEP2→STEP3] Critical extraction failure:`, extractionError);
      console.error(`❌ [STEP2→STEP3] Error type:`, typeof extractionError);
      console.error(
        `❌ [STEP2→STEP3] Error stack:`,
        extractionError instanceof Error ? extractionError.stack : "No stack"
      );
      return {
        status: "failed",
        collectedData: {},
        collectionRate: 0,
        searchEvidence,
        websiteContent: websiteScrapingResult?.content,
        websiteContentLength: websiteScrapingResult?.contentLength,
        apiCallsUsed: searchResults.length,
        processingTime: Date.now() - startTime,
      };
    }
  } catch (error) {
    console.error(`❌ [STEP2-ERROR] Company lookup failed at some point before search evidence processing!`);
    console.error(`❌ [STEP2-ERROR] Error details:`, error);
    console.error(`❌ [STEP2-ERROR] Error type:`, typeof error);
    console.error(`❌ [STEP2-ERROR] Error stack:`, error instanceof Error ? error.stack : "No stack");

    return {
      status: "failed",
      collectedData: {},
      collectionRate: 0,
      searchEvidence: {},
      apiCallsUsed: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

// scrape company website
// ---------------------

async function scrapeCompanyWebsite(websiteUrl) {
  // URL standardization and protocol handling
  let url = websiteUrl;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  // Prepare www variant for reliability testing
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.startsWith("www.") && urlObj.hostname.split(".").length === 2) {
      const wwwUrl = `${urlObj.protocol}//www.${urlObj.hostname}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }
  } catch (error) {
    return { success: false, error: "Invalid URL format" };
  }

  // Browser simulation configurations for reliable access
  const requestConfigs = [
    {
      timeout: 30000,
      maxRedirects: 10,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    },
    {
      timeout: 35000,
      maxRedirects: 15,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
      },
    },
  ];

  // Smart URL prioritization: Start with Google-verified URL, then fallbacks
  const urlsToTry = [];

  // Priority 1: Original URL (already Google-verified from Step 1)
  urlsToTry.push(url);

  // Priority 2: www variant if original doesn't have it
  if (!url.includes("://www.")) {
    urlsToTry.push(url.replace(/^(https?:\/\/)/, "$1www."));
  }

  // Priority 3: HTTP fallback only if HTTPS fails
  if (url.startsWith("https://")) {
    urlsToTry.push(url.replace("https://", "http://"));
    if (!url.includes("://www.")) {
      urlsToTry.push(url.replace("https://", "http://www."));
    }
  }

  for (let urlIndex = 0; urlIndex < urlsToTry.length; urlIndex++) {
    const tryUrl = urlsToTry[urlIndex];

    // For first URL (Google-verified), only try first config. For fallbacks, try all configs.
    const configsToTry = urlIndex === 0 ? [requestConfigs[0]] : requestConfigs;

    for (let configIndex = 0; configIndex < configsToTry.length; configIndex++) {
      const config = configsToTry[configIndex];
      console.log("config", config);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        console.log("controller", controller);

        const response = await fetch(tryUrl, {
          method: "GET",
          headers: config.headers,
          signal: controller.signal,
          redirect: "follow",
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          continue;
        }

        // Check content type - only process HTML
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("text/html")) {
          continue;
        }

        // Parse HTML and extract structured content
        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract metadata from HTML head
        const metadata = {
          title: $("title").text().trim(),
          metaDescription: $('meta[name="description"]').attr("content")?.trim() || "",
          ogTitle: $('meta[property="og:title"]').attr("content")?.trim() || "",
          ogDescription: $('meta[property="og:description"]').attr("content")?.trim() || "",
          ogSiteName: $('meta[property="og:site_name"]').attr("content")?.trim() || "",
          twitterTitle: $('meta[name="twitter:title"]').attr("content")?.trim() || "",
          twitterDescription: $('meta[name="twitter:description"]').attr("content")?.trim() || "",
          robots: $('meta[name="robots"]').attr("content")?.trim() || "",
          canonical: $('link[rel="canonical"]').attr("href")?.trim() || "",
        };

        console.log(`📄 [METADATA-EXTRACTION] Extracted metadata for ${tryUrl}:`, {
          title: metadata.title ? `"${metadata.title}"` : "None",
          metaDescription: metadata.metaDescription ? `"${metadata.metaDescription.substring(0, 100)}..."` : "None",
          ogTitle: metadata.ogTitle ? `"${metadata.ogTitle}"` : "None",
          ogDescription: metadata.ogDescription ? `"${metadata.ogDescription.substring(0, 100)}..."` : "None",
        });

        // Verify HTML contains meaningful business content
        const footerCheck = html.toLowerCase();
        const hasBusinessContent =
          footerCheck.includes("copyright") ||
          footerCheck.includes("©") ||
          footerCheck.includes("contact") ||
          footerCheck.includes("about");

        // Clean HTML for content extraction
        $("script, style").remove();

        // Extract links and identify navigation pages to scrape
        const socialLinks = [];
        const allLinks = [];
        const navigationLinks = [];

        // Phase 1: Collect ALL internal links with href attributes first
        const allInternalLinks = [];

        $("a[href]").each((_, element) => {
          const href = $(element).attr("href");
          const text = $(element).text().trim();

          if (!href) return;

          try {
            // Only include internal links (same domain or relative)
            const isInternal = href.startsWith("/") || href.includes(new URL(tryUrl).hostname);
            if (isInternal && !href.includes("#") && !href.includes("mailto:") && !href.includes("tel:")) {
              const fullUrl = href.startsWith("/") ? new URL(href, tryUrl).href : href;
              allInternalLinks.push({
                url: fullUrl,
                text: text,
                element: element,
                href: href,
              });
            }
          } catch (e) {
            console.error(`Error processing link: ${href}`, e);
          }
        });

        // Enhanced submenu detection for all page builders
        const allSubMenuElements = $(
          ".sub-menu a[href], " + // WordPress standard
            ".dropdown-menu a[href], " + // Bootstrap dropdowns
            ".elementor-sub-menu a[href], " + // Elementor submenu
            ".elementor-dropdown-menu a[href], " + // Elementor dropdown
            ".et_pb_menu_inner a[href], " + // Divi submenu
            ".et_pb_dropdown a[href], " + // Divi dropdown
            ".fl-sub-menu a[href], " + // Beaver Builder submenu
            ".fl-dropdown a[href], " + // Beaver Builder dropdown
            ".fusion-sub-menu a[href], " + // Avada submenu
            ".vc_tta-panel a[href], " + // Visual Composer panels
            ".wpb_tab a[href], " + // WPBakery tabs
            '[class*="submenu"] a[href], ' + // Generic submenu class
            '[class*="dropdown"] a[href], ' + // Generic dropdown class
            '[class*="sub-menu"] a[href]' // Variations of sub-menu
        );
        const allMenuItemElements = $('li[class*="menu-item"] a[href]');
        const allFlMenuElements = $(".fl-menu a[href]");

        // Store submenu elements for force classification after main processing
        const submenuElementsForForcing = [];
        if (allSubMenuElements.length > 0) {
          allSubMenuElements.each((_, element) => {
            const href = $(element).attr("href");
            const text = $(element).text().trim();
            if (href && href !== "#" && href !== "" && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
              // Add ALL submenu links that aren't obviously external social/utility
              const isObviouslyExternal =
                href.includes("facebook.com") ||
                href.includes("twitter.com") ||
                href.includes("linkedin.com") ||
                href.includes("instagram.com") ||
                href.includes("youtube.com") ||
                href.includes("x.com");

              if (!isObviouslyExternal) {
                submenuElementsForForcing.push(href);
              }
            }
          });
        }

        // Map submenu links to their parent categories
        const submenusByCategory = {};
        $(".sub-menu").each((_, submenuElement) => {
          const parentMenuItem = $(submenuElement).closest('li[class*="menu-item"]');
          const parentText = parentMenuItem.find("> div > a, > a").first().text().trim();

          if (parentText) {
            submenusByCategory[parentText] = [];
            $(submenuElement)
              .find("a[href]")
              .each((_, linkElement) => {
                const linkText = $(linkElement).text().trim();
                const linkHref = $(linkElement).attr("href");
                if (linkHref && linkText) {
                  submenusByCategory[parentText].push(`${linkText} (${linkHref})`);
                }
              });
          }
        });

        // Phase 2: Process each internal link for categorization
        allInternalLinks.forEach((linkData) => {
          const { url: fullUrl, text, element, href } = linkData;
          const hasIcon = $(element).find("img, svg, i, span[class]").length > 0;
          const isImageLink = $(element).find("img").length > 0;

          // Collect all links for debugging
          allLinks.push(`"${text || "No text"}" -> ${href}`);

          // Check for social media patterns
          const isSocialUrl =
            href &&
            (href.includes("facebook.com") ||
              href.includes("twitter.com") ||
              href.includes("linkedin.com") ||
              href.includes("instagram.com") ||
              href.includes("youtube.com") ||
              href.includes("x.com"));

          // Check for icon-based links or social URLs (but be more selective)
          const isSocialText = text.match(/facebook|twitter|linkedin|instagram|youtube|social|follow|share/i);
          const isIconOnlyLink = hasIcon && (!text || text.length < 3);

          if (isSocialUrl || (isIconOnlyLink && isSocialText)) {
            socialLinks.push(`${text || "Icon Link"}: ${href}`);
            return; // Skip social links for navigation
          }

          // Phase 3: Enhanced navigation context detection
          const isFooterLink = $(element).closest('footer, .footer, [class*="footer"]').length > 0;

          // Check for specific menu patterns first (WordPress, page builders)
          const isWordPressMenuItem = $(element).closest('li[class*="menu-item"]').length > 0;
          const isSubMenuLink = $(element).closest('.sub-menu, .dropdown-menu, [class*="submenu"]').length > 0;
          const isBeaverBuilderNav = $(element).closest(".fl-menu, .fl-module-menu").length > 0;

          // General navigation selectors
          const isGeneralNavLink =
            $(element).closest(
              `
            nav, .nav, header, .header,
            [class*="nav"], [class*="menu"], [id*="nav"], [id*="menu"],
            .navbar, .main-nav, .top-nav, .primary-nav, .site-nav, .navigation,
            .nav-bar, .nav-menu, .main-menu, .primary-menu, .site-menu,
            .header-nav, .header-menu, .top-menu, .top-bar,
            ul.menu, ul.nav, .menu-list, .nav-list,
            .menubar, .nav-wrap, .nav-container, .menu-wrap, .menu-container,
            .desktop-nav, .main-navigation, .site-navigation,
            [role="navigation"], [role="menubar"],
            .masthead, .banner, .site-header, .page-header,
            .toolbar, .actionbar, .links, .tabs, .tab-menu,
            [class*="header"], [class*="top"], [class*="main"], 
            [id*="header"], [id*="top"], [id*="main"],
            .elementor-nav-menu, .elementor-menu, .et_pb_menu, .et_pb_menu_inner,
            .vc_tta-tabs-list, .wpb_tabs_nav, .divi-menu, .fusion-menu,
            .avada-menu, .genesis-nav-menu, .thrive-menu, .oxygen-menu,
            [class*="elementor"], [class*="et_pb"], [class*="vc_"], 
            [class*="wpb_"], [class*="divi"], [class*="fusion"]
          `
                .replace(/\s+/g, " ")
                .trim()
            ).length > 0;

          // Navigation link if any context is found (prioritize specific patterns)
          const isNavLink = isWordPressMenuItem || isSubMenuLink || isBeaverBuilderNav || isGeneralNavLink;

          if (isNavLink && !isFooterLink) {
            navigationLinks.push(href);
          }
        });

        // FORCE CLASSIFICATION: Override any missed submenu/dropdown links after main processing
        if (submenuElementsForForcing.length > 0) {
          let addedCount = 0;
          submenuElementsForForcing.forEach((href) => {
            if (!navigationLinks.includes(href)) {
              navigationLinks.push(href);
              addedCount++;
            }
          });
        }

        // Remove duplicate navigation links (same links appear in mobile/desktop nav)
        const uniqueNavigationLinks = Array.from(new Set(navigationLinks));

        // Prioritize links with high-value keywords for company information
        const priorityKeywords = [
          "contact",
          "about",
          "team",
          "company",
          "leadership",
          "management",
          "staff",
          "people",
          "executives",
        ];
        const prioritizedLinks = uniqueNavigationLinks.sort((a, b) => {
          const aText = $(`a[href="${a}"]`).first().text().toLowerCase();
          const bText = $(`a[href="${b}"]`).first().text().toLowerCase();
          const aHasPriority = priorityKeywords.some(
            (keyword) => aText.includes(keyword) || a.toLowerCase().includes(keyword)
          );
          const bHasPriority = priorityKeywords.some(
            (keyword) => bText.includes(keyword) || b.toLowerCase().includes(keyword)
          );

          if (aHasPriority && !bHasPriority) return -1;
          if (!aHasPriority && bHasPriority) return 1;
          return 0; // Keep original order for non-priority links
        });

        // Show navigation links to be scraped (up to maxPages limit)
        if (prioritizedLinks.length > 0) {
          const maxPages = 15; // Increased limit for better coverage
          const pagesToScrape = Math.min(prioritizedLinks.length, maxPages);
          console.log(
            `🔗 [WEBSITE-SCRAPER] Found ${prioritizedLinks.length} unique navigation links, will scrape up to ${pagesToScrape} pages`
          );
          console.log(
            `🔗 [WEBSITE-SCRAPER] Pages to scrape (prioritized): ${prioritizedLinks.slice(0, pagesToScrape).join(", ")}`
          );
        }

        // Extract text from main content areas with inline links preserved
        // THREE-PHASE CONTENT EXTRACTION

        // Phase 1: Extract main homepage content (external links only, no nav/footer duplication)
        const mainContent = extractContentWithLinks($, {
          selector: "body",
          excludeNavigation: true,
          includeInternalLinks: false,
        });

        // Phase 2: Extract footer content once (external links only)
        const footerContent = extractContentWithLinks($, {
          contentType: "footer",
          includeInternalLinks: false,
        });

        // Phase 3: Create separate sections for homepage and footer content with metadata
        const baseUrl = new URL(tryUrl).hostname;

        // Create metadata section if any metadata exists
        let metadataSection = "";
        const hasMetadata = metadata.title || metadata.metaDescription || metadata.ogTitle || metadata.ogDescription;

        if (hasMetadata) {
          metadataSection = "\n\nPAGE METADATA:";
          if (metadata.title) metadataSection += `\nTitle: ${metadata.title}`;
          if (metadata.metaDescription) metadataSection += `\nDescription: ${metadata.metaDescription}`;
          if (metadata.ogTitle && metadata.ogTitle !== metadata.title)
            metadataSection += `\nOG Title: ${metadata.ogTitle}`;
          if (metadata.ogDescription && metadata.ogDescription !== metadata.metaDescription)
            metadataSection += `\nOG Description: ${metadata.ogDescription}`;
          if (metadata.ogSiteName) metadataSection += `\nSite Name: ${metadata.ogSiteName}`;
          if (metadata.canonical) metadataSection += `\nCanonical URL: ${metadata.canonical}`;
        }

        let textContent = `WEBSITE CONTENT EVIDENCE: ${baseUrl}${metadataSection}

${mainContent}`;

        // Add footer as separate section if content exists
        if (footerContent && footerContent.trim()) {
          const footerSection = `WEBSITE CONTENT EVIDENCE: ${baseUrl} (Footer)
${footerContent}`;
          textContent += `\n\n${footerSection}`;
        }

        // Track scraped pages for summary logging
        const scrapedPages = [{ url: tryUrl, chars: mainContent.length, type: "Homepage" }];

        // Add footer to scraped pages if it exists
        if (footerContent && footerContent.trim()) {
          scrapedPages.push({ url: `${baseUrl} (Footer)`, chars: footerContent.length, type: "Footer" });
        }

        // Scrape navigation pages for additional content
        if (prioritizedLinks.length > 0) {
          const navigationResult = await scrapeNavigationPages(prioritizedLinks, tryUrl, config);
          if (navigationResult.content) {
            textContent += "\n\n" + navigationResult.content;

            // Add actual character counts for each navigation page
            for (const pageDetail of navigationResult.pageDetails) {
              scrapedPages.push({
                url: pageDetail.url,
                chars: pageDetail.chars,
                type: "Navigation",
              });
            }
          }
        }

        // Note: Social and body links are now embedded inline where they appear in content
        // No separate social links section needed as they're captured in context

        // No content length limit - preserve all scraped content for comprehensive analysis
        const finalContent = textContent;

        // Log scraping summary
        console.log(`✅ [WEBSITE-SCRAPING] Scraping completed successfully!`);
        console.log(`📊 [SCRAPING-SUMMARY] Total pages scraped: ${scrapedPages.length}`);
        console.log(`📊 [SCRAPING-SUMMARY] Total characters: ${finalContent.length.toLocaleString()}`);
        console.log(`┌─────────────────────────────────────────────────────────────────────┐`);
        console.log(`│ URL SCRAPING SUMMARY                                                │`);
        console.log(`├─────────────────────────────────────────────────────────────────────┤`);
        scrapedPages.forEach((page, index) => {
          const shortUrl = page.url.length > 50 ? page.url.substring(0, 47) + "..." : page.url;
          const chars = page.chars.toLocaleString().padStart(8);
          const type = page.type.padEnd(10);
          console.log(`│ ${(index + 1).toString().padStart(2)}. ${type} ${chars} chars │ ${shortUrl.padEnd(46)} │`);
        });
        console.log(`└─────────────────────────────────────────────────────────────────────┘`);

        // 🔍 TRACE STEP 1: Final content after scraping
        console.log(`🔍 [TRACE-1] INITIAL SCRAPE COMPLETE`);
        console.log(`🔍 [TRACE-1] finalContent.length: ${finalContent.length}`);
        console.log(`🔍 [TRACE-1] First 200 chars: ${finalContent.substring(0, 200)}`);
        console.log(`🔍 [TRACE-1] Last 200 chars: ${finalContent.substring(finalContent.length - 200)}`);
        console.log(`🔍 [TRACE-1] Contains 'Scott Agatep': ${finalContent.includes("Scott Agatep")}`);
        console.log(`🔍 [TRACE-1] Contains 'Strategic Advisers': ${finalContent.includes("Strategic Advisers")}`);

        return {
          success: true,
          content: finalContent,
          contentLength: finalContent.length,
          url: tryUrl,
        };
      } catch (error) {
        console.log(`❌ [WEBSITE-SCRAPING] Error occurred during scraping: ${error}`);
      }
    }
  }

  // All attempts failed
  console.log(`❌ [WEBSITE-SCRAPING] Scraping failed after trying multiple URLs and configurations`);
  console.log(`📊 [SCRAPING-SUMMARY] Total pages scraped: 0`);
  console.log(`📊 [SCRAPING-SUMMARY] Total characters: 0`);

  return {
    success: false,
    error: "Failed to scrape website after multiple attempts with different configurations",
  };
}

// extract content with links
//---------------------------

function extractContentWithLinks($, options) {
  const { selector = "body", excludeNavigation = false, includeInternalLinks = true, contentType = "main" } = options;

  // Clone the selected element to avoid modifying original DOM
  let $content = $(selector).clone();

  // Remove scripts, styles, and tracking elements
  $content.find("script, style").remove();

  // Remove comprehensive tracking and analytics elements
  $content
    .find(
      [
        // Google Analytics & Tag Manager (more comprehensive patterns)
        'iframe[src*="googletagmanager"]',
        'iframe[src*="google-analytics"]',
        'iframe[src*="analytics.google"]',
        'noscript iframe[src*="googletagmanager"]',
        "noscript", // Remove all noscript tags that often contain tracking

        // Facebook/Meta tracking pixels
        'img[src*="facebook.com/tr"]',
        'iframe[src*="facebook.com"]',
        'noscript img[src*="facebook.com"]',

        // LinkedIn tracking pixels (more comprehensive)
        'img[src*="ads.linkedin"]',
        'img[src*="px.ads.linkedin"]',
        'img[src*="linkedin.com"]',
        'noscript img[src*="linkedin"]',

        // Twitter/X tracking
        'img[src*="analytics.twitter"]',
        'img[src*="t.co/"]',

        // Generic tracking patterns (catch-all for 1x1 pixels)
        'img[width="1"][height="1"]',
        'img[width="1px"][height="1px"]',
        'img[style*="display:none"]',
        'img[style*="visibility:hidden"]',
        'iframe[style*="display:none"]',
        'iframe[style*="visibility:hidden"]',
        'iframe[height="0"][width="0"]',
        'iframe[height="0px"][width="0px"]',

        // Common tracking service domains
        'iframe[src*="doubleclick"]',
        'img[src*="doubleclick"]',
        'iframe[src*="googlesyndication"]',
        'img[src*="googlesyndication"]',
        'iframe[src*="googleadservices"]',
        'img[src*="googleadservices"]',

        // Additional analytics services
        'iframe[src*="hotjar"]',
        'iframe[src*="mixpanel"]',
        'iframe[src*="segment"]',
        'iframe[src*="amplitude"]',
        'iframe[src*="fullstory"]',
        'img[src*="quantserve"]',

        // Skip-to-content links (accessibility, but not content)
        'a[href*="#"][class*="skip"]',
        'a[href*="#"][class*="screen-reader"]',
        ".skip-link",
        ".screen-reader-text",
      ].join(", ")
    )
    .remove();

  // Handle different content type extractions
  if (contentType === "navigation") {
    // Extract only navigation areas
    const navSelectors = [
      "nav",
      "header",
      ".navigation",
      ".nav",
      ".menu",
      ".main-menu",
      ".navbar",
      ".nav-menu",
      '[class*="nav"]',
      '[class*="menu"]',
    ];
    $content = $(navSelectors.join(", ")).first().clone() || $("nav").first().clone();
  } else if (contentType === "footer") {
    // Extract only footer areas
    const footerSelectors = ["footer", ".footer", ".site-footer", '[class*="footer"]'];
    $content = $(footerSelectors.join(", ")).first().clone() || $("footer").first().clone();
  } else if (excludeNavigation) {
    // Remove navigation and footer areas for main content extraction
    $content
      .find(
        [
          "nav",
          "header",
          "footer",
          ".navigation",
          ".nav",
          ".menu",
          ".main-menu",
          ".navbar",
          ".nav-menu",
          ".header",
          ".site-header",
          ".footer",
          ".site-footer",
          '[class*="nav"]:not([class*="content"])',
          '[class*="menu"]:not([class*="content"])',
          '[class*="header"]:not([class*="content"])',
          '[class*="footer"]:not([class*="content"])',
        ].join(", ")
      )
      .remove();
  }

  // Get current domain for internal link detection
  const currentPageUrl = $('link[rel="canonical"]').attr("href") || $('meta[property="og:url"]').attr("content") || "";
  let currentDomain = "";
  try {
    if (currentPageUrl) {
      currentDomain = new URL(currentPageUrl).hostname;
    }
  } catch (e) {
    // Fallback - try to extract domain from any absolute link
    $content.find('a[href^="http"]').each((_, element) => {
      try {
        if (!currentDomain) {
          const href = $(element).attr("href");
          const testDomain = new URL(href).hostname;
          // Simple heuristic: if this domain appears in multiple links, it's likely the current domain
          if ($content.find(`a[href*="${testDomain}"]`).length > 1) {
            currentDomain = testDomain;
          }
        }
      } catch (e) {
        // Continue
      }
    });
  }

  // Process links based on inclusion settings
  $content.find("a[href]").each((_, element) => {
    const $link = $(element);
    const href = $link.attr("href");
    const text = $link.text().trim();

    if (!href || href === "#") {
      $link.replaceWith(text || "");
      return;
    }

    // Handle mailto and tel links (always include)
    if (href.startsWith("mailto:") || href.startsWith("tel:")) {
      const linkWithUrl = text ? `${text} (${href})` : `Link (${href})`;
      $link.replaceWith(linkWithUrl);
      return;
    }

    // Determine if link is internal or external
    const isInternal =
      href.startsWith("/") ||
      href.startsWith("./") ||
      href.startsWith("../") ||
      (currentDomain && href.includes(currentDomain));

    // Apply link inclusion rules
    if (isInternal && !includeInternalLinks) {
      // Skip internal links when not including them
      $link.replaceWith(text || "");
    } else if (href && href !== "#") {
      // Include the link with URL
      const linkWithUrl = text ? `${text} (${href})` : `Link (${href})`;
      $link.replaceWith(linkWithUrl);
    } else {
      // Keep just the text for non-actionable links
      $link.replaceWith(text || "");
    }
  });

  // Extract final text content with embedded links
  let textContent = $content
    .text()
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\n+/g, "\n") // Normalize line breaks
    .trim();

  // Remove common tracking text patterns that might slip through DOM removal
  textContent = textContent
    // Remove complete iframe/img tags that made it through as text
    .replace(/<iframe[^>]*googletagmanager[^>]*>[^<]*<\/iframe>/gi, "")
    .replace(/<iframe[^>]*src="[^"]*googletagmanager[^"]*"[^>]*><\/iframe>/gi, "")
    .replace(/<img[^>]*ads\.linkedin[^>]*\/?>/gi, "")
    .replace(/<img[^>]*px\.ads\.linkedin[^>]*\/?>/gi, "")
    .replace(/<img[^>]*height="1"[^>]*width="1"[^>]*\/?>/gi, "")
    .replace(/<img[^>]*width="1"[^>]*height="1"[^>]*\/?>/gi, "")

    // Google Tag Manager/Analytics text
    .replace(/Skip to content \(#[^)]+\)/g, "")
    .replace(/Skip to main content/gi, "")
    .replace(/Skip to content/gi, "")
    .replace(/Skip navigation/gi, "")

    // Common accessibility skip links
    .replace(/Skip to (?:main |primary )?(?:content|navigation|menu)/gi, "")
    .replace(/Jump to (?:main |primary )?(?:content|navigation|menu)/gi, "")

    // Social media follow text often mixed with tracking
    .replace(/Follow us on\s+/gi, "")
    .replace(/Connect with us\s+/gi, "")

    // Clean up extra whitespace created by removals
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();

  return textContent;
}

// formate search result in table
// ------------------------------
function formatSearchResultsAsTable(results, strategyName, fullSearchQuery, targetFields) {
  const header = `=== SEARCH STRATEGY: ${strategyName} ===
Search Terms: ${fullSearchQuery}
Target Fields: ${targetFields.join(", ") || "General information"}
Results Found: ${results.length}
`;

  const formattedResults = results
    .map((result, index) => {
      const resultNumber = index + 1;
      const title = result.title || "No title";
      const url = result.link || "No URL";
      const snippet = result.snippet || "No snippet available";

      // Create pre-formatted source attribution strings
      const titleSourceAttribution = `Google search, ${strategyName}, result ${resultNumber} (${url}), title`;
      const snippetSourceAttribution = `Google search, ${strategyName}, result ${resultNumber} (${url}), snippet`;

      return `SEARCH EVIDENCE #${resultNumber}
├── Title: ${title}
├── Snippet: ${snippet}
├── Title Source Attribution: "${titleSourceAttribution}"
└── Snippet Source Attribution: "${snippetSourceAttribution}"

`;
    })
    .join("");

  return header + formattedResults;
}

// format web is side content with url attributions
// ------------------------------

function formatWebsiteContentWithURLAttributions(websiteContent) {
  console.log(`🔍 [TRACE-FORMAT-1] formatWebsiteContentWithURLAttributions called`);
  console.log(`🔍 [TRACE-FORMAT-1] Input websiteContent.length: ${websiteContent?.length || "undefined"}`);
  console.log(`🔍 [TRACE-FORMAT-1] Input type: ${typeof websiteContent}`);

  if (!websiteContent || typeof websiteContent !== "string") {
    console.log(`🔍 [TRACE-FORMAT-1] Early return due to invalid input`);
    return "";
  }

  const sections = [];

  // Split content by URL evidence markers
  const urlSections = websiteContent.split("WEBSITE CONTENT EVIDENCE: ");
  console.log(`🔍 [TRACE-FORMAT-2] urlSections.length after split: ${urlSections.length}`);

  for (let i = 1; i < urlSections.length; i++) {
    console.log(`🔍 [TRACE-FORMAT-3] Processing section ${i}/${urlSections.length - 1}`);
    const section = urlSections[i];
    console.log(`🔍 [TRACE-FORMAT-3] Raw section length: ${section.length}`);
    console.log(`🔍 [TRACE-FORMAT-3] Raw section preview: ${section.substring(0, 150)}`);

    const lines = section.split("\n");
    console.log(`🔍 [TRACE-FORMAT-4] lines.length after split: ${lines.length}`);
    console.log(`🔍 [TRACE-FORMAT-4] First line (URL): ${lines[0]?.trim()}`);

    const url = lines[0]?.trim();
    const content = lines.slice(1).join("\n").trim();

    console.log(`🔍 [TRACE-FORMAT-5] content.length after slice/join/trim: ${content.length}`);
    console.log(`🔍 [TRACE-FORMAT-5] content preview (first 200): ${content.substring(0, 200)}`);
    console.log(`🔍 [TRACE-FORMAT-5] content contains 'Scott Agatep': ${content.includes("Scott Agatep")}`);
    console.log(`🔍 [TRACE-FORMAT-5] content contains 'Strategic Advisers': ${content.includes("Strategic Advisers")}`);

    if (url && content) {
      // Format this section with direct URL attribution, preserving the evidence marker
      const contentToUse = content.substring(0, 6500);
      console.log(`🔍 [TRACE-FORMAT-6] contentToUse.length after substring(0, 6500): ${contentToUse.length}`);
      console.log(`🔍 [TRACE-FORMAT-6] Applied truncation?: ${content.length > 6500 ? "YES" : "NO"}`);
      console.log(`🔍 [TRACE-FORMAT-6] contentToUse contains 'Scott Agatep': ${contentToUse.includes("Scott Agatep")}`);
      console.log(
        `🔍 [TRACE-FORMAT-6] contentToUse contains 'Strategic Advisers': ${contentToUse.includes("Strategic Advisers")}`
      );

      const formattedSection = `WEBSITE CONTENT EVIDENCE: ${url}
├── Content: ${contentToUse}${content.length > 6500 ? "..." : ""}
└── Source Attribution: "${url}"`;

      console.log(`🔍 [TRACE-FORMAT-7] formattedSection.length: ${formattedSection.length}`);

      sections.push(formattedSection);
    } else {
      console.log(`🔍 [TRACE-FORMAT-5] Skipped section - url: ${!!url}, content: ${!!content}`);
    }
  }

  const result = sections.join("\n\n");
  console.log(`🔍 [TRACE-FORMAT-8] FINAL RESULT`);
  console.log(`🔍 [TRACE-FORMAT-8] result.length: ${result.length}`);
  console.log(`🔍 [TRACE-FORMAT-8] sections.length: ${sections.length}`);
  console.log(`🔍 [TRACE-FORMAT-8] result contains 'Scott Agatep': ${result.includes("Scott Agatep")}`);
  console.log(`🔍 [TRACE-FORMAT-8] result contains 'Strategic Advisers': ${result.includes("Strategic Advisers")}`);

  return result;
}

// Extract data from search results
// ------------------------------
async function extractDataFromSearchResults(searchResults, searchStrategies, fullPrompt) {
  const startTime = Date.now();

  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) {
    return {
      success: false,
      extractedData: {},
      confidenceScore: 0,
      error: "Gemini API key not configured",
    };
  }

  try {
    // Build extraction prompt with search results and strategies
    const extractionPrompt = buildExtractionPrompt(searchResults, searchStrategies, fullPrompt);

    // Build dynamic response schema to enforce exact field names
    const responseSchema = buildResponseSchema(searchStrategies);

    console.log(`🔧 [GEMINI-DEBUG] Request details:`, {
      model: "gemini-2.5-flash",
      promptLength: extractionPrompt.length,
      searchResultsCount: searchResults.length,
      strategiesCount: searchStrategies.length,
      schemaFieldsCount: Object.keys(responseSchema.properties).length,
    });

    const systemPrompt =
      "You are a data extraction specialist. Follow the user instructions exactly. Use ONLY the exact field names specified in the schema. Return pure JSON only - no markdown, no code blocks, no additional text.";

    // Call Gemini API for extraction using REST API with dynamic schema
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\n${extractionPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 16384,
        temperature: 0.1, // Lower for strict compliance
        topP: 0.9,
        topK: 1, // Most deterministic
        responseMimeType: "application/json",
        responseSchema: responseSchema, // Dynamic schema enforcement
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ [GEMINI-API-ERROR] ${response.status} ${response.statusText}: ${errorBody}`);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    console.log(`🔍 [GEMINI-RESPONSE-DEBUG] Full response structure:`, JSON.stringify(data, null, 2));

    const extractedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!extractedContent) {
      console.error(`❌ [GEMINI-RESPONSE-ERROR] No content found in response:`, {
        hasData: !!data,
        hasCandidates: !!data.candidates,
        candidatesLength: data.candidates?.length,
        firstCandidate: data.candidates?.[0],
        hasContent: !!data.candidates?.[0]?.content,
        hasParts: !!data.candidates?.[0]?.content?.parts,
        partsLength: data.candidates?.[0]?.content?.parts?.length,
        firstPart: data.candidates?.[0]?.content?.parts?.[0],
      });
      throw new Error("No content returned from Gemini API");
    }

    console.log(`📡 [AI-RAW-RESPONSE] Raw Gemini response:`, extractedContent);

    // Parse JSON response - should be clean now with improved prompt
    let extractedData = {};
    try {
      extractedData = JSON.parse(extractedContent);
      console.log(`✅ [JSON-PARSE] Successfully parsed JSON response`);
    } catch (parseError) {
      console.log(`⚠️ [JSON-PARSE-ERROR] Parse failed: ${parseError.message}`);
      console.log(`📄 [RAW-CONTENT] First 500 chars: ${extractedContent.substring(0, 500)}`);
      console.log(
        `📄 [RAW-CONTENT] Last 500 chars: ${extractedContent.substring(Math.max(0, extractedContent.length - 500))}`
      );
      console.log(`📏 [CONTENT-LENGTH] Total response length: ${extractedContent.length} characters`);

      // Check if the response was truncated by looking for incomplete JSON structure
      if (parseError.message.includes("Unterminated string") || parseError.message.includes("Unexpected end")) {
        console.log(`🔄 [RETRY-ATTEMPT] Response appears truncated, attempting to parse partial JSON...`);

        // Try to salvage what we can by finding the last complete field
        const lastCompleteMatch = extractedContent.lastIndexOf('"}');
        if (lastCompleteMatch > 0) {
          const truncatedContent = extractedContent.substring(0, lastCompleteMatch + 2) + "}";
          try {
            extractedData = JSON.parse(truncatedContent);
            console.log(
              `✅ [PARTIAL-RECOVERY] Successfully parsed truncated response with ${
                Object.keys(extractedData).length
              } fields`
            );
          } catch (recoveryError) {
            console.log(`❌ [RECOVERY-FAILED] Could not recover from truncated response: ${recoveryError}`);
            throw new Error(`Could not parse JSON from Gemini response: ${parseError.message}`);
          }
        } else {
          throw new Error(`Could not parse JSON from Gemini response: ${parseError.message}`);
        }
      } else {
        throw new Error(`Could not parse JSON from Gemini response: ${parseError.message}`);
      }
    }

    // Clean extracted data while preserving AI's original source attribution
    const cleanedData = {};
    for (const [key, value] of Object.entries(extractedData)) {
      if (value !== null && value !== undefined && value !== "" && value !== "unknown" && value !== "n/a") {
        // Handle contact information objects better
        if (
          key.toLowerCase().includes("contact") &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          !key.toLowerCase().includes("source")
        ) {
          // Format contact object as readable text
          const contactParts = [];
          if (value.email) contactParts.push(`Email: ${value.email}`);
          if (value.phone) contactParts.push(`Phone: ${value.phone}`);
          if (value.address) contactParts.push(`Address: ${value.address}`);
          cleanedData[key] = contactParts.length > 0 ? contactParts.join(", ") : value;
        } else {
          // Preserve AI's original source attribution - don't modify source fields
          cleanedData[key] = value;
        }
      } else {
        // For fields with no data, set appropriate default based on field type
        if (key.endsWith("_source")) {
          // Source fields should show "Not found" when no relevant data exists
          cleanedData[key] = "Not found";
        }
        // Skip empty data fields (don't include them in final output)
      }
    }

    // Post-processing: Check for cases where AI cited irrelevant sources for unknown data
    for (const [key, value] of Object.entries(cleanedData)) {
      if (key.endsWith("_source")) {
        const dataFieldName = key.replace("_source", "");
        const dataValue = cleanedData[dataFieldName];

        // If data field is unknown/empty but source field has a citation, it's likely irrelevant
        if ((dataValue === "unknown" || !dataValue) && value && value !== "Not found") {
          cleanedData[key] = "Not found";
        }
      }
    }

    console.log(`📊 [AI-FINAL-RESULTS] Processed extraction results:`, JSON.stringify(cleanedData, null, 2));

    // Calculate confidence score based on cleaned data
    const totalFields = searchStrategies.length;
    const extractedFields = Object.keys(cleanedData).length;
    const extractionRate = totalFields > 0 ? Math.round((extractedFields / totalFields) * 100) : 0;
    const confidenceScore = Math.min(extractionRate, 95); // Cap at 95%

    return {
      success: extractionRate > 30,
      extractedData: cleanedData,
      rawAiResponse: extractedData, // Include the raw parsed JSON response
      confidenceScore,
    };
  } catch (error) {
    console.error(`❌ [AI-ERROR] Gemini extraction failed:`, error);
    console.error(`❌ [AI-ERROR] Error type:`, typeof error);
    console.error(`❌ [AI-ERROR] Error details:`, error instanceof Error ? error.message : String(error));
    console.error(`❌ [AI-ERROR] Full error object:`, error);

    return {
      success: false,
      extractedData: {},
      confidenceScore: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Build extraction prompt
// ------------------------------
function buildExtractionPrompt(searchResults, searchStrategies, fullPrompt) {
  console.log(`🔧 [STEP3-PROMPT-BUILD] Building extraction prompt with ${searchResults.length} search results`);
  // Format search results for inclusion in the user's prompt - SEND ALL RESULTS
  const searchResultsText = searchResults.map((result, index) => `RESULT ${index + 1}:\n${result}\n---`).join("\n");
  // Use ONLY the user-configurable prompt from database - no hardcoded instructions
  const finalPrompt = `${fullPrompt}

${searchResultsText}`;

  console.log(`📋 [AI-INPUT] Complete search evidence file being sent to Gemini AI:`);
  console.log(`🔍 [AI-INPUT-CHECK] Checking for website content in search results...`);
  const hasWebsiteContent = searchResults.some((result) => result.includes("WEBSITE CONTENT EVIDENCE"));
  console.log(`🕷️ [AI-INPUT-CHECK] Website content found in search results: ${hasWebsiteContent}`);

  if (hasWebsiteContent) {
    const websiteContentIndex = searchResults.findIndex((result) => result.includes("WEBSITE CONTENT EVIDENCE"));
    const websiteResult = searchResults[websiteContentIndex];
    const contentLength = (websiteResult.match(/\((\d+) characters\)/) || ["", "0"])[1];
    console.log(`✅ [AI-INPUT-CHECK] Website content at index ${websiteContentIndex + 1}, ${contentLength} characters`);
  } else {
    console.log(`❌ [AI-INPUT-CHECK] NO website content found in ${searchResults.length} search results!`);
    console.log(
      `🔍 [AI-INPUT-CHECK] Search result types:`,
      searchResults.map((result, i) => `${i + 1}: ${result.substring(0, 50)}...`)
    );
  }

  console.log(`========== SEARCH EVIDENCE FILE START ==========`);
  console.log(searchResultsText);
  console.log(`========== SEARCH EVIDENCE FILE END ==========`);
  console.log(`📏 [STEP3-PROMPT-BUILD] Final prompt length: ${finalPrompt.length} characters`);

  return finalPrompt;
}

// Build dynamic response schema from search strategies
// ------------------------------
function buildResponseSchema(searchStrategies) {
  const properties = {};
  const required = [];

  searchStrategies.forEach((strategy) => {
    if (strategy.isActive && strategy.extractAs !== "No output") {
      const fieldName = strategy.searchObjectKey;

      // Define field type based on extractAs
      switch (strategy.extractAs) {
        case "number":
          properties[fieldName] = { type: "number" };
          break;
        case "list":
          properties[fieldName] = {
            type: "array",
            items: { type: "string" },
          };
          break;
        case "date":
          properties[fieldName] = {
            type: "string",
            format: "date-time",
          };
          break;
        default: // Simple text, Address
          properties[fieldName] = { type: "string" };
      }

      // Add source attribution field
      properties[`${fieldName}_source`] = { type: "string" };

      required.push(fieldName, `${fieldName}_source`);
    }
  });

  return {
    type: "object",
    properties,
    required,
  };
}

// Scrape navigation pages for company data
// ------------------------------
async function scrapeNavigationPages(navigationLinks, baseUrl, config) {
  const additionalContent = [];
  const pageDetails = [];
  const maxPages = 15; // Increased limit for better coverage of priority pages
  const baseHost = new URL(baseUrl).hostname;

  for (let i = 0; i < Math.min(navigationLinks.length, maxPages); i++) {
    const navLink = navigationLinks[i];

    try {
      // Convert relative URLs to absolute
      const fullUrl = navLink.startsWith("/") ? `${new URL(baseUrl).origin}${navLink}` : navLink;

      // Skip if not same domain
      if (!fullUrl.includes(baseHost)) {
        continue;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: config.headers,
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      const $ = Cheerio.load(html);

      // Extract only main content with external links (no navigation duplication)
      const pageContent = extractContentWithLinks($, {
        selector: "body",
        excludeNavigation: true,
        includeInternalLinks: false,
      });

      // Include all scraped content with URL attribution
      const pageUrl = new URL(fullUrl).hostname + new URL(fullUrl).pathname;
      const pageContentFormatted = `WEBSITE CONTENT EVIDENCE: ${pageUrl}
${pageContent.substring(0, 6500)}`;
      additionalContent.push(pageContentFormatted);

      // Track actual character count for this specific page
      pageDetails.push({ url: fullUrl, chars: pageContentFormatted.length });
    } catch (error) {
      // Continue to next link if this one fails
    }
  }

  return {
    content: additionalContent.join("\n\n"),
    pageDetails,
  };
}
