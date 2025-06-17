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
    const ff = cs.fontFamily.replace(/\"/g, ""); // Remove quotes from font family
    return { backgroundColor: bc, textColor: tc, linkColor: lc, frameColor: fc, fontFamily: ff };
  });
  // 2) Screenshot palette (PNG)
  const buffer = await page.screenshot({ fullPage: true, type: "png" });
  const palette = await getColors(buffer, "image/png");
  const hexes = palette.map((c) => c.hex().toUpperCase());
  // 3) Logo & title (before close)
  const [logoUrl, name] = await Promise.all([
    page.evaluate(() => {
      const selectors = ["img[alt*=logo]", "img[src*=logo]", "link[rel=icon]", "meta[property='og:image']"];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return el.src || el.href || el.content;
      }
      return null;
    }),
    page.title(),
  ]);
  await browser.close();
  // 4) Assemble theme with all hex colors
  return {
    logo: logoUrl,
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
  };
}
