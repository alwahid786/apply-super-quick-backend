import puppeteer from "puppeteer";
import getColors from "get-image-colors";
import { openai } from "../../../configs/constants.js";

async function validateLogoColors(url, colors) {
  if (typeof url !== "string" || !url.startsWith("http")) throw new Error("A valid website URL is required");
  if (!Array.isArray(colors)) throw new Error("An array of HEX color strings is required");
  // Function schema: model returns only filteredColors[]
  const functions = [
    {
      name: "filterLogoColors",
      description: "Remove any colors not found in the website’s logos",
      parameters: {
        type: "object",
        properties: {
          filteredColors: {
            type: "array",
            description: "Input colors filtered to only those present in logos",
            items: { type: "string" },
          },
        },
        required: ["filteredColors"],
      },
    },
  ];

  // Ask GPT-4o to fetch the URL, detect all logo assets,
  // check which of the provided colors appear in those logos,
  // and return only the matching subset.
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `
You are a web‑verification assistant.
Given:
  • A website URL
  • An array of candidate HEX color codes
You must:
  1) Fetch the live page.
  2) Locate every logo asset (favicons, <img> logos, CSS/SVG logos).
  3) Sample the colors from those logos.
  4) Compare against the input array and remove any colors not present.
Return exactly one function call to "filterLogoColors" with property "filteredColors" (no extra fields).
`,
      },
      {
        role: "user",
        content: JSON.stringify({ url, colors }),
      },
    ],
    functions,
    function_call: { name: "filterLogoColors" },
  });

  // Parse and return the filteredColors array
  const fnCall = completion.choices?.[0]?.message?.function_call;
  if (!fnCall?.arguments) {
    throw new Error("Logo color validation failed");
  }
  const { filteredColors } = JSON.parse(fnCall.arguments);
  return filteredColors;
}
async function filterColorsByLogosWithAI(colors, logos) {
  if (!Array.isArray(colors) || !Array.isArray(logos))
    throw new Error("colors must be an array and logos must be an array of {url:string}");
  // Define the function schema for filtering
  const functions = [
    {
      name: "filterLogoColors",
      description: "Keep only the input colors that are actually present in the provided logo images",
      parameters: {
        type: "object",
        properties: {
          filteredColors: {
            type: "array",
            description: "Subset of input HEX colors that appear in the logos",
            items: { type: "string" },
          },
        },
        required: ["filteredColors"],
      },
    },
  ];
  // Call the model
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `
You are a logo‑color validator.  
Given:
  • An array "colors" of candidate 6‑digit uppercase HEX codes  
  • An array "logos" of objects { url: string } pointing to logo images  
You must:
  1) Download or fetch each logo image.  
  2) Sample the colors in those logos.  
  3) Compare to the input list and remove any HEX codes not found.  
Return exactly one function call to "filterLogoColors" with a single property "filteredColors" containing the intersection.
`,
      },
      {
        role: "user",
        content: JSON.stringify({ colors, logos }),
      },
    ],
    functions,
    function_call: { name: "filterLogoColors" },
  });
  // Extract the filtered array
  const fn = completion.choices?.[0]?.message?.function_call;
  if (!fn?.arguments) throw new Error("Logo color filtering failed");
  const { filteredColors } = JSON.parse(fn.arguments);
  return filteredColors;
}

function rgbToHex(color) {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return color;
  const [r, g, b] = m.slice(1, 4).map(Number);
  return (
    "#" +
    [r, g, b]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}
export async function fetchBranding(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // executablePath: '/path/to/chrome'
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);
  page.setDefaultTimeout(0);

  try {
    await page.goto(url, { waitUntil: ["domcontentloaded"], timeout: 0 });
    await page.waitForSelector("body", { timeout: 5000 });

    // 1) Computed styles
    const computed = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      const a = document.querySelector("a");
      const frameEl = document.querySelector(".card, .panel, .frame, fieldset") || document.body;
      return {
        backgroundColor: cs.backgroundColor,
        textColor: cs.color,
        linkColor: a ? getComputedStyle(a).color : null,
        frameColor: getComputedStyle(frameEl).borderColor,
        fontFamily: cs.fontFamily.replace(/"/g, ""),
      };
    });

    // 2) Screenshot palette (fallback source)
    const buffer = await page.screenshot({ fullPage: true, type: "png" });
    const screenshotPalette = await getColors(buffer, "image/png");
    const screenshotHexes = screenshotPalette.map((c) => c.hex().toUpperCase());

    // 3) Logo extraction
    let logos = await page.evaluate(() => {
      const items = [];
      const selectors = ["img[alt*=logo i]", "img[src*=logo i]", "img[class*=logo i]", "img[id*=logo i]"];
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((img) => {
          if (img.src) items.push({ type: "img", url: img.src, width: img.naturalWidth, height: img.naturalHeight });
        });
      });
      return items;
    });
    if (logos.length === 0) {
      logos = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll("img").forEach((img) => {
          if (img.src && img.naturalWidth >= 100 && img.naturalHeight >= 50) {
            items.push({ type: "img", url: img.src, width: img.naturalWidth, height: img.naturalHeight });
          }
        });
        return items;
      });
    }
    const extraLogos = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll("link[rel*=icon]").forEach((link) => {
        if (link.href) items.push({ type: "icon", url: link.href, width: null, height: null });
      });
      const og = document.querySelector('meta[property="og:image"]');
      if (og && og.content) items.push({ type: "og:image", url: og.content, width: null, height: null });
      document.querySelectorAll("[class*=logo i], [id*=logo i]").forEach((el) => {
        const bg = getComputedStyle(el).backgroundImage;
        const m = bg.match(/url\(['"]?(.*?)['"]?\)/);
        if (m && m[1]) items.push({ type: "background", url: m[1], width: el.offsetWidth, height: el.offsetHeight });
      });
      document.querySelectorAll("svg").forEach((svg) => {
        const cls = svg.className?.baseVal || "";
        const id = svg.id || "";
        if (/logo/i.test(cls) || /logo/i.test(id)) {
          const xml = new XMLSerializer().serializeToString(svg);
          const data = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
          items.push({ type: "inline-svg", url: data, width: svg.clientWidth, height: svg.clientHeight });
        }
      });
      return items;
    });
    logos = [...logos, ...extraLogos];
    const seen = new Set();
    logos = logos.filter((i) => !seen.has(i.url) && seen.add(i.url));
    logos.sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0));
    logos = logos.slice(0, 5);

    // 4) Site color extraction (up to 5)
    const rawColors = await page.evaluate(() => {
      const colors = new Set();
      document.querySelectorAll("*").forEach((el) => {
        const s = getComputedStyle(el);
        ["color", "backgroundColor", "borderColor"].forEach((p) => {
          if (s[p]?.startsWith("rgb")) colors.add(s[p]);
        });
      });
      return Array.from(colors).slice(0, 20);
    });
    let siteColors = [...new Set(rawColors.map(rgbToHex))].slice(0, 5);
    // pad siteColors from screenshotHexes
    for (const hex of screenshotHexes) {
      if (siteColors.length >= 5) break;
      if (!siteColors.includes(hex)) siteColors.push(hex);
    }

    // 5) Logo color sampling (up to 5)
    let logoColors = [];
    for (const logo of logos) {
      try {
        const pal = await getColors(logo.url);
        pal.forEach((c) => logoColors.push(c.hex().toUpperCase()));
      } catch {}
    }
    let logoHexes = [...new Set(logoColors)];
    // pad logoHexes from screenshotHexes
    for (const hex of screenshotHexes) {
      if (!logoHexes.includes(hex)) logoHexes.push(hex);
    }
    // const filteredLoosColors = await validateLogoColors(url, logoHexes);
    const filteredLoosColors = await filterColorsByLogosWithAI(logoHexes, logos);

    const title = await page.title();
    await browser.close();

    console.log("logo hexes", logoHexes);
    console.log("filtered colors ", filteredLoosColors);

    return {
      name: title,
      url,
      logos,
      colors: {
        primary: screenshotHexes[0],
        secondary: screenshotHexes[1] || "#FFFFFF",
        accent: screenshotHexes[2] || screenshotHexes[0],
        link: computed.linkColor ? rgbToHex(computed.linkColor) : null,
        text: computed.textColor ? rgbToHex(computed.textColor) : null,
        background: computed.backgroundColor ? rgbToHex(computed.backgroundColor) : null,
        frame: computed.frameColor ? rgbToHex(computed.frameColor) : null,
      },
      fontFamily: computed.fontFamily,
      color_palette: { fromLogo: filteredLoosColors?.slice(0, 5), fromSite: siteColors },
    };
  } catch (err) {
    await browser.close();
    throw err;
  }
}
