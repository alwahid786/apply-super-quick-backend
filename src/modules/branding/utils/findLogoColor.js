import { Vibrant } from "node-vibrant/node";

async function getMainColor(file) {
  try {
    const palette = await Vibrant.from(file.buffer).getPalette();
    let dominant = null;
    for (const swatch of Object.values(palette)) {
      if (swatch && (!dominant || swatch.population > dominant.population)) dominant = swatch;
    }
    if (!dominant) throw new Error("No colors detected");
    return dominant.hex;
  } catch (err) {
    throw new Error(`Color extraction failed: ${err.message}`);
  }
}
export { getMainColor };
