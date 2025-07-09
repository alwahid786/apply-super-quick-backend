import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { openai } from "../../../configs/constants.js";

async function extractCompanyInfo(url) {
  let html = "";
  let $;
  let contactPageHtml = "";
  let contactPage$;

  // Step 1: Try fetching HTML with Axios for main page
  try {
    const response = await axios.get(url, { timeout: 10000 });
    html = response.data;
    $ = cheerio.load(html);
  } catch (error) {
    console.warn("Axios fetch failed for main page:", error.message);
  }

  // Step 2: Use Puppeteer for dynamic content and contact page
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);
  page.setDefaultTimeout(0);
  try {
    // Fetch main page
    await page.goto(url, { waitUntil: "networkidle0", timeout: 0 });
    await page.waitForSelector("body", { timeout: 10000 });
    html = await page.content();
    $ = cheerio.load(html);

    // Try navigating to contact page
    const contactUrl = new URL(url).origin + "/contact-us";
    try {
      await page.goto(contactUrl, { waitUntil: "networkidle0", timeout: 10000 });
      contactPageHtml = await page.content();
      contactPage$ = cheerio.load(contactPageHtml);
    } catch (contactError) {
      console.warn("Contact page fetch failed:", contactError.message);
    }
  } catch (puppeteerError) {
    console.error("Puppeteer fetch failed:", puppeteerError.message);
    await browser.close();
    return null;
  }
  await browser.close();

  // Initialize result object
  const result = {
    legalName: "",
    dbaName: "",
    businessClassification: "",
    businessDescription: "",
    physicalAddress: "",
    llcNumber: "",
    contact: { phone: "", email: "" },
  };

  // Step 3: Look for schema.org Organization data
  let organizationData = null;
  $('script[type="application/ld+json"]').each((i, elem) => {
    try {
      const data = JSON.parse($(elem).html());
      if (data["@type"] === "Organization") {
        organizationData = data;
      }
    } catch (e) {
      console.warn("Invalid JSON-LD:", e.message);
    }
  });

  if (organizationData) {
    result.legalName = organizationData.legalName || organizationData.name || "";
    result.dbaName = organizationData.name || "";
    result.businessClassification = organizationData.industry || organizationData.sameAs?.join(", ") || "";
    result.businessDescription = organizationData.description || "";
    if (organizationData.address && organizationData.address["@type"] === "PostalAddress") {
      result.physicalAddress = [
        organizationData.address.streetAddress,
        organizationData.address.addressLocality,
        organizationData.address.addressRegion,
        organizationData.address.postalCode,
        organizationData.address.addressCountry,
      ]
        .filter(Boolean)
        .join(", ");
    }
    result.contact.phone = organizationData.telephone || "";
    result.contact.email = organizationData.email || "";
  }

  // Step 4: Fallback extraction with Cheerio (main page and contact page)
  const $combined = contactPageHtml ? cheerio.load(html + contactPageHtml) : $;
  if (!result.legalName) {
    result.legalName = $combined("h1").first().text().trim() || $combined("title").text().trim();
    result.dbaName = result.legalName;
  }
  if (!result.businessDescription || result.businessDescription.length < 50) {
    let aboutText = $combined('section[id="about"]').text().trim();
    if (!aboutText) {
      aboutText = $combined('div[class*="about"]').text().trim();
    }
    if (!aboutText) {
      aboutText = $combined('h2:contains("About"), h2:contains("Our Story"), h3:contains("About")')
        .nextUntil("h2, h3")
        .text()
        .trim();
    }
    if (aboutText) {
      result.businessDescription = aboutText.substring(0, 500);
    }
  }
  if (!result.physicalAddress) {
    result.physicalAddress = $combined("address").first().text().trim();
    if (!result.physicalAddress) {
      result.physicalAddress = $combined("footer address").first().text().trim();
    }
    if (!result.physicalAddress) {
      result.physicalAddress = $combined('footer div[class*="address"]').first().text().trim();
    }
    if (!result.physicalAddress) {
      result.physicalAddress = $combined('footer p[class*="location"]').first().text().trim();
    }
    if (!result.physicalAddress) {
      result.physicalAddress = $combined('footer p:contains("Address")').first().text().trim();
    }
    if (!result.physicalAddress && contactPage$) {
      result.physicalAddress = contactPage$('p:contains("Address"), div:contains("Address")').first().text().trim();
    }
  }
  if (!result.contact.email) {
    $combined('a[href^="mailto:"]').each((i, elem) => {
      const email = $combined(elem).attr("href").replace("mailto:", "");
      if (email && !result.contact.email) {
        result.contact.email = email;
      }
    });
  }
  if (!result.contact.phone) {
    $combined('a[href^="tel:"]').each((i, elem) => {
      const phone = $combined(elem).attr("href").replace("tel:", "");
      if (phone && !result.contact.phone) {
        result.contact.phone = phone;
      }
    });
  }

  // Step 5: Use regex for additional contact info and LLC number
  const allText = $combined("body").text();
  if (!result.contact.email) {
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = allText.match(emailRegex) || [];
    if (emails.length > 0) {
      result.contact.email = emails[0];
    }
  }
  if (!result.contact.phone) {
    const phoneRegex = /\b(\+\d{1,3}[-.]?)?\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const phones = allText.match(phoneRegex) || [];
    if (phones.length > 0) {
      result.contact.phone = phones[0];
    }
  }
  let llcNumber = "";
  const llcRegex =
    /(?:LLC Number|Registration Number|Tax ID|Company Number|Business ID|License Number|Corporate ID)\s*[:\-]?\s*([\w-]+)/i;
  const match = allText.match(llcRegex);
  if (match) {
    llcNumber = match[1];
  }
  result.llcNumber = llcNumber;

  // Step 6: Use OpenAI for missing fields
  if (
    !result.contact.email ||
    !result.contact.phone ||
    !result.businessClassification ||
    !result.physicalAddress ||
    !result.llcNumber ||
    !result.businessDescription
  ) {
    const contactSection =
      $combined('section[id="contact"]').text() ||
      $combined('div[class*="contact"]').text() ||
      $combined("footer").text() ||
      allText.substring(0, 4000);
    try {
      const prompt = `
        From the following text, extract the company's email address, phone number, industry classification, full physical address (including street, city, state, postal code, country), LLC number or registration number, and business description. Summarize the business description to 100-200 words if possible, focusing on the company's primary activities. Return in JSON format:
        {
          "email": "",
          "phone": "",
          "industry": "",
          "address": "",
          "llcNumber": "",
          "description": ""
        }
        Text: ${contactSection}
      `;
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 300,
        temperature: 0.7,
      });
      const openaiResult = JSON.parse(response.data.choices[0].text.trim());
      if (openaiResult.email && !result.contact.email) {
        result.contact.email = openaiResult.email;
      }
      if (openaiResult.phone && !result.contact.phone) {
        result.contact.phone = openaiResult.phone;
      }
      if (openaiResult.industry && !result.businessClassification) {
        result.businessClassification = openaiResult.industry;
      }
      if (openaiResult.address && !result.physicalAddress) {
        result.physicalAddress = openaiResult.address;
      }
      if (openaiResult.llcNumber && !result.llcNumber) {
        result.llcNumber = openaiResult.llcNumber;
      }
      if (openaiResult.description && (!result.businessDescription || result.businessDescription.length < 50)) {
        result.businessDescription = openaiResult.description;
      }
    } catch (openaiError) {
      console.warn("OpenAI API request failed:", openaiError.message);
    }
  }

  // Log if fields are not found
  if (!result.llcNumber) {
    console.log("LLC number not found on the website.");
    result.llcNumber = "N/A";
  }
  if (!result.physicalAddress) {
    console.log("Physical address not found on the website.");
  }
  if (!result.businessDescription) {
    console.log("Business description not found on the website.");
  }
  if (!result.contact.email) {
    console.log("Email not found on the website.");
  }
  if (!result.contact.phone) {
    console.log("Phone number not found on the website.");
  }

  return result;
}

export { extractCompanyInfo };
