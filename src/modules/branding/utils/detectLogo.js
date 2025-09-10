import sharp from "sharp";
import fetch from "node-fetch";

async function analyzeLogo(url) {
  let buffer;
  if (/^https?:\/\//.test(url)) {
    const res = await fetch(url);
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    buffer = await fs.promises.readFile(url);
  }

  const img = sharp(buffer).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

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

  if (!hasTransparency) return { url, type: "full-image", invisible: false };

  const avg = count > 0 ? (r + g + b) / (3 * count) : 0;
  const invisible = avg > 200;
  return { url, type: "logo", invisible };
}

async function analyzeLogos(urls) {
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        return await analyzeLogo(url);
      } catch (err) {
        return { url, error: err.message };
      }
    })
  );
  return results;
}

export default analyzeLogos;
