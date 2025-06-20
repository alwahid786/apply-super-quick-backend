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
    const selectors = [
      "img[alt*=logo]",
      "img[src*=logo]",
      "link[rel=icon]",
      "meta[property='og:image']",
      "img[src*='logo']",
    ];
    const elements = [];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        let url = el.src || el.href || el.content;
        if (url && !elements.find((e) => e.url === url)) {
          elements.push({
            url,
            width: el.naturalWidth || el.width || null,
            height: el.naturalHeight || el.height || null,
          });
        }
      });
    });
    return elements;
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
