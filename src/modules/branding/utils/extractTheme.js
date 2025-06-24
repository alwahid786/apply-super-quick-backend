import puppeteer from "puppeteer";
import getColors from "get-image-colors";

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
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  // 1) Computed styles
  const computed = await page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    const bc = cs.backgroundColor;
    const tc = cs.color;
    const a = document.querySelector("a");
    const lc = a && getComputedStyle(a).color;
    const frameEl = document.querySelector(".card, .panel, .frame, fieldset") || document.body;
    const fc = getComputedStyle(frameEl).borderColor;
    const ff = cs.fontFamily.replace(/\"/g, "");
    return { backgroundColor: bc, textColor: tc, linkColor: lc, frameColor: fc, fontFamily: ff };
  });
  // 2) Screenshot palette (PNG)
  const buffer = await page.screenshot({ fullPage: true, type: "png" });
  const palette = await getColors(buffer, "image/png");
  const hexes = palette.map((c) => c.hex().toUpperCase());
  // 3) All possible logo elements with dimensions
  const logos = await page.evaluate(() => {
    const elements = [];
    // Collect <img> tags with logo indicators
    const imgSelectors = ["img[alt*='logo' i]", "img[src*='logo' i]", "img[class*='logo' i]", "img[id*='logo' i]"];
    imgSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.src) {
          elements.push({
            type: "img",
            url: el.src,
            width: el.naturalWidth || el.width || null,
            height: el.naturalHeight || el.height || null,
          });
        }
      });
    });
    // Collect favicon
    const icon = document.querySelector("link[rel~='icon']");
    if (icon && icon.href) {
      elements.push({ type: "icon", url: icon.href, width: null, height: null });
    }
    // Collect og:image meta
    const ogImg = document.querySelector("meta[property='og:image']");
    if (ogImg && ogImg.content) {
      elements.push({ type: "og:image", url: ogImg.content, width: null, height: null });
    }
    // Collect background images on elements with logo-like classes
    document.querySelectorAll("[class*='logo' i], [id*='logo' i]").forEach((el) => {
      const bg = window.getComputedStyle(el).backgroundImage;
      const urlMatch = bg && bg.match(/url\(["']?(.*?)["']?\)/);
      if (urlMatch && urlMatch[1]) {
        elements.push({
          type: "background",
          url: urlMatch[1],
          width: el.offsetWidth,
          height: el.offsetHeight,
        });
      }
    });
    // Inline SVGs
    document.querySelectorAll("svg").forEach((svgEl) => {
      const outer = svgEl.outerHTML;
      const isLogoLike = /logo/i.test(svgEl.className?.baseVal || "") || /logo/i.test(svgEl.id || "");
      if (isLogoLike) {
        elements.push({
          type: "inline-svg",
          url: "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(outer))),
          width: svgEl.clientWidth || null,
          height: svgEl.clientHeight || null,
        });
      }
    });
    // Remove duplicates by URL
    const unique = [];
    const seen = new Set();
    for (const el of elements) {
      if (!seen.has(el.url)) {
        seen.add(el.url);
        unique.push(el);
      }
    }
    return unique;
  });
  // 4) Extract page-wide color palette
  const colorPalette = await page.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll("*"));
    const colors = new Set();
    allElements.forEach((el) => {
      const styles = getComputedStyle(el);
      ["color", "backgroundColor", "borderColor"].forEach((prop) => {
        const val = styles[prop];
        if (val && val.startsWith("rgb")) {
          colors.add(val);
        }
      });
    });
    return Array.from(colors).slice(0, 20);
  });
  const color_palette = [...new Set(colorPalette.map(rgbToHex))].slice(0, 10);
  const name = await page.title();
  await browser.close();
  return {
    logos,
    name,
    url,
    colors: {
      primary: hexes[0],
      secondary: hexes[1] || "#FFFFFF",
      accent: hexes[2] || hexes[0],
      link: computed.linkColor ? rgbToHex(computed.linkColor) : null,
      text: computed.textColor ? rgbToHex(computed.textColor) : null,
      background: computed.backgroundColor ? rgbToHex(computed.backgroundColor) : null,
      frame: computed.frameColor ? rgbToHex(computed.frameColor) : null,
    },
    fontFamily: computed.fontFamily,
    color_palette,
  };
}
