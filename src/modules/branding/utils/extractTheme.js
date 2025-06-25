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
    let logoHexes = [...new Set(logoColors)].slice(0, 5);
    // pad logoHexes from screenshotHexes
    for (const hex of screenshotHexes) {
      if (logoHexes.length >= 5) break;
      if (!logoHexes.includes(hex)) logoHexes.push(hex);
    }

    const title = await page.title();
    await browser.close();

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
      color_palette: { fromLogo: logoHexes, fromSite: siteColors },
    };
  } catch (err) {
    await browser.close();
    throw err;
  }
}
