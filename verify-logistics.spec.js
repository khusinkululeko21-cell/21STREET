const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { expect, test } = require("@playwright/test");

test.use({
  browserName: "chromium",
  channel: "msedge"
});

const pageUrl = pathToFileURL(path.join(__dirname, "index.html")).href;
const artifactDir = path.join(__dirname, "playwright-artifacts");

function collectCanvasStats() {
  const canvas = document.querySelector("#logistics-scene");
  if (!canvas) {
    return { found: false };
  }

  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (gl && gl.readPixels) {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    const colorBuckets = new Set();
    let visibleSamples = 0;
    let samples = 0;
    const stride = Math.max(4, Math.floor(pixels.length / 10000 / 4) * 4);

    for (let i = 0; i < pixels.length; i += stride) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      samples += 1;

      if (a > 24 && r + g + b > 36) {
        visibleSamples += 1;
      }

      colorBuckets.add(`${r >> 4},${g >> 4},${b >> 4},${a >> 4}`);
    }

    return {
      found: true,
      renderer: canvas.dataset.renderer,
      type: "webgl",
      width,
      height,
      visibleRatio: visibleSamples / samples,
      colorBuckets: colorBuckets.size
    };
  }

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const colorBuckets = new Set();
  let visibleSamples = 0;
  let samples = 0;
  const stride = Math.max(4, Math.floor(pixels.length / 10000 / 4) * 4);

  for (let i = 0; i < pixels.length; i += stride) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    samples += 1;

    if (a > 24 && r + g + b > 36) {
      visibleSamples += 1;
    }

    colorBuckets.add(`${r >> 4},${g >> 4},${b >> 4},${a >> 4}`);
  }

  return {
    found: true,
    renderer: canvas.dataset.renderer,
    type: "2d",
    width,
    height,
    visibleRatio: visibleSamples / samples,
    colorBuckets: colorBuckets.size
  };
}

test.describe("logistics website", () => {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 }
  ]) {
    test(`${viewport.name} renders a visible 3D logistics scene`, async ({ page }) => {
      fs.mkdirSync(artifactDir, { recursive: true });
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(pageUrl, { waitUntil: "networkidle" });
      await expect(page.locator("h1")).toHaveText("Njilo Consulting Logistics");
      await expect(page.locator("#logistics-scene")).toBeVisible();
      await page.waitForFunction(() => {
        const canvas = document.querySelector("#logistics-scene");
        return canvas && canvas.clientWidth > 300 && canvas.clientHeight > 300 && canvas.width > 300;
      });
      await page.waitForTimeout(1800);

      const stats = await page.evaluate(collectCanvasStats);
      expect(stats.found).toBeTruthy();
      expect(stats.renderer).toBe("three");
      expect(stats.width).toBeGreaterThan(300);
      expect(stats.height).toBeGreaterThan(300);
      expect(stats.visibleRatio).toBeGreaterThan(0.12);
      expect(stats.colorBuckets).toBeGreaterThan(18);

      await page.screenshot({
        path: path.join(artifactDir, `${viewport.name}.png`),
        fullPage: true
      });
    });
  }
});
