import sharp from "sharp";
import fetch from "node-fetch";
import fs from "fs";

async function analyzeLogo(url) {
  let buffer;

  try {
    if (/^https?:\/\//.test(url)) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      buffer = await fs.promises.readFile(url);
    }

    const img = sharp(buffer).ensureAlpha();
    const { data } = await img.raw().toBuffer({ resolveWithObject: true });

    let r = 0,
      g = 0,
      b = 0,
      count = 0,
      hasTransparency = false;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha < 255) hasTransparency = true;
      if (alpha > 0) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
    }

    if (!count) throw new Error("Empty or unreadable image");

    const avg = (r + g + b) / (3 * count);
    const invisible = avg > 200;

    return {
      url,
      type: hasTransparency ? "logo" : "full-image",
      invisible,
    };
  } catch (err) {
    return { url, error: err.message };
  }
}

export async function analyzeLogos(urls) {
  return Promise.all(urls.map(analyzeLogo));
}

export default analyzeLogo;
