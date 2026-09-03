const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const DASHBOARD_CONFIG_PATH = path.join(ROOT, "js", "dashboard-config.js");
const SNAPSHOT_CONFIG_PATH = path.join(ROOT, "snapshot-config.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readExistingMetadata(config) {
  const metadataPath = path.join(ROOT, config.snapshot.metadataPath);

  if (!fs.existsSync(metadataPath)) {
    return { dashboards: [] };
  }

  try {
    const metadata = readJson(metadataPath);
    return Array.isArray(metadata.dashboards) ? metadata : { dashboards: [] };
  } catch (error) {
    return { dashboards: [] };
  }
}

function loadDashboardConfig() {
  const source = fs.readFileSync(DASHBOARD_CONFIG_PATH, "utf8");
  const sandbox = { window: {} };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: DASHBOARD_CONFIG_PATH });

  if (!Array.isArray(sandbox.window.DASHBOARD_CONFIG)) {
    throw new Error("js/dashboard-config.js did not define window.DASHBOARD_CONFIG as an array.");
  }

  return sandbox.window.DASHBOARD_CONFIG;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80) || "dashboard";
}

function hasPublicUrl(item) {
  return Boolean(item && typeof item.url === "string" && item.url.trim());
}

function appendUrlParam(url, name, value) {
  const hashIndex = url.indexOf("#");
  const hash = hashIndex === -1 ? "" : url.substring(hashIndex);
  const base = hashIndex === -1 ? url : url.substring(0, hashIndex);

  if (base.indexOf(`${name}=`) !== -1) return url;

  return `${base}${base.indexOf("?") === -1 ? "?" : "&"}${encodeURIComponent(name)}=${encodeURIComponent(value)}${hash}`;
}

function buildCaptureUrl(url) {
  const trimmed = String(url || "").trim();

  if (trimmed.indexOf("powerbi.com") !== -1) {
    return appendUrlParam(trimmed, "pageView", "fitToPage");
  }

  return trimmed;
}

function getRequestedId() {
  const idIndex = process.argv.indexOf("--id");
  const equalsArg = process.argv.find((arg) => arg.indexOf("--id=") === 0);

  if (equalsArg) return equalsArg.substring("--id=".length);
  if (idIndex !== -1 && process.argv[idIndex + 1]) return process.argv[idIndex + 1];

  return "";
}

async function waitForPowerBi(page, config) {
  const timeout = config.capture.visualWaitTimeoutMs;

  try {
    await page.waitForLoadState("networkidle", { timeout: Math.min(timeout, 45000) });
  } catch (error) {
    console.log(`Network idle was not reached before timeout: ${error.message}`);
  }

  const selectors = [
    "iframe",
    ".visualContainer",
    ".visual",
    "[aria-label*='Power BI']",
    "canvas",
    "svg"
  ];

  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 10000, state: "visible" });
      break;
    } catch (error) {
      // Try the next signal. Published Power BI pages vary by tenant and report type.
    }
  }

  await page.waitForTimeout(config.capture.finalRenderDelayMs);
}

async function captureDashboard(browser, item, config) {
  const outputDir = path.join(ROOT, config.snapshot.outputDir);
  const configuredFormat = String(config.image.format || "jpg").toLowerCase();
  const format = configuredFormat === "png" ? "png" : "jpeg";
  const extension = format === "jpeg" ? "jpg" : format;
  const filename = `${String(item.id)}-${slugify(item.name)}.${extension}`;
  const relativePath = `${config.snapshot.outputDir}/${filename}`.replace(/\\/g, "/");
  const outputPath = path.join(outputDir, filename);
  const page = await browser.newPage({
    viewport: {
      width: config.viewport.width,
      height: config.viewport.height
    },
    deviceScaleFactor: 1
  });

  page.setDefaultTimeout(config.capture.navigationTimeoutMs);
  page.setDefaultNavigationTimeout(config.capture.navigationTimeoutMs);

  try {
    const url = buildCaptureUrl(item.url);

    console.log(`Capturing ${item.id}: ${item.name}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: config.capture.navigationTimeoutMs
    });

    await waitForPowerBi(page, config);

    await page.screenshot({
      path: outputPath,
      type: format,
      quality: format === "png" ? undefined : config.image.quality,
      fullPage: false,
      animations: "disabled"
    });

    return {
      id: item.id,
      name: item.name || "Dashboard",
      snapshotPath: relativePath,
      capturedAt: new Date().toISOString(),
      status: "ok"
    };
  } catch (error) {
    console.error(`Failed to capture ${item.id}: ${item.name}`);
    console.error(error && error.stack ? error.stack : error);

    return {
      id: item.id,
      name: item.name || "Dashboard",
      snapshotPath: relativePath,
      capturedAt: new Date().toISOString(),
      status: "failed",
      error: error && error.message ? error.message : String(error)
    };
  } finally {
    await page.close();
  }
}

async function main() {
  const config = readJson(SNAPSHOT_CONFIG_PATH);
  const requestedId = getRequestedId();
  const dashboards = loadDashboardConfig()
    .filter(hasPublicUrl)
    .filter((item) => !requestedId || String(item.id) === String(requestedId));

  const outputDir = path.join(ROOT, config.snapshot.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  if (!dashboards.length) {
    throw new Error(requestedId
      ? `No dashboard with a public URL matched --id ${requestedId}.`
      : "No dashboards with public URLs were found.");
  }

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const dashboard of dashboards) {
      results.push(await captureDashboard(browser, dashboard, config));
    }
  } finally {
    await browser.close();
  }

  const existingMetadata = requestedId ? readExistingMetadata(config) : { dashboards: [] };
  const mergedResults = requestedId
    ? existingMetadata.dashboards
        .filter((item) => !results.some((result) => String(result.id) === String(item.id)))
        .concat(results)
        .sort((a, b) => Number(a.id) - Number(b.id))
    : results;
  const metadata = {
    generatedAt: new Date().toISOString(),
    dashboards: mergedResults
  };

  fs.writeFileSync(
    path.join(ROOT, config.snapshot.metadataPath),
    `${JSON.stringify(metadata, null, 2)}\n`
  );

  const failed = results.filter((item) => item.status !== "ok");
  console.log(`Snapshot capture complete: ${results.length - failed.length} ok, ${failed.length} failed.`);

  if (failed.length) {
    console.log("Failures:");
    failed.forEach((item) => console.log(`- ${item.id}: ${item.name} - ${item.error || item.status}`));
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
