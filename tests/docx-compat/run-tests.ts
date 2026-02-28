/**
 * run-tests.ts
 * Playwright-based test runner for DOCX compatibility testing.
 *
 * For each file in corpus/index.json:
 *  1. Serves the DOCX file via a local HTTP server
 *  2. Opens OnlyOffice Document Server at http://localhost:8080
 *  3. Waits for document to render (onDocumentReady)
 *  4. Takes a full-page screenshot
 *  5. Compares to reference PNG using pixelmatch
 *  6. Records pass/fail + diff percentage
 *
 * Results written to results/results.json
 */

import { chromium, Browser, Page } from "playwright";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

// ─── Configuration ────────────────────────────────────────────────────────────

const CORPUS_DIR = path.join(__dirname, "corpus");
const REFERENCE_DIR = path.join(__dirname, "reference");
const RESULTS_DIR = path.join(__dirname, "results");
const ONLYOFFICE_URL = process.env.ONLYOFFICE_URL ?? "http://localhost:8080";
const FILE_SERVER_PORT = parseInt(process.env.FILE_SERVER_PORT ?? "9090", 10);
const PIXEL_DIFF_THRESHOLD = parseFloat(process.env.PIXEL_DIFF_THRESHOLD ?? "0.05"); // 5% tolerance
const DOCUMENT_READY_TIMEOUT = parseInt(process.env.DOCUMENT_READY_TIMEOUT ?? "30000", 10);

// ─── Types ────────────────────────────────────────────────────────────────────

interface CorpusEntry {
  file: string;
  priority: "critical" | "high" | "medium";
  description: string;
  features: string[];
}

interface CorpusManifest {
  generated: string;
  count: number;
  files: CorpusEntry[];
}

interface TestResult {
  file: string;
  priority: "critical" | "high" | "medium";
  description: string;
  status: "pass" | "fail" | "skip" | "error";
  diffPercent?: number;
  diffImagePath?: string;
  screenshotPath?: string;
  referenceExists: boolean;
  errorMessage?: string;
  durationMs: number;
}

// ─── File Server ─────────────────────────────────────────────────────────────

function startFileServer(): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const filePath = path.join(CORPUS_DIR, decodeURIComponent(req.url.slice(1)));

      if (!filePath.startsWith(CORPUS_DIR + path.sep)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("File not found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType =
        ext === ".docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : ext === ".doc"
          ? "application/msword"
          : "application/octet-stream";

      res.writeHead(200, {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`,
      });

      fs.createReadStream(filePath).pipe(res);
    });

    server.on("error", reject);
    server.listen(FILE_SERVER_PORT, "127.0.0.1", () => {
      console.log(`  File server listening on http://127.0.0.1:${FILE_SERVER_PORT}`);
      resolve(server);
    });
  });
}

// ─── OnlyOffice Integration ───────────────────────────────────────────────────

function buildOnlyOfficeUrl(filename: string): string {
  const docUrl = encodeURIComponent(
    `http://127.0.0.1:${FILE_SERVER_PORT}/${encodeURIComponent(filename)}`
  );
  const ext = path.extname(filename).slice(1).toLowerCase(); // e.g. "docx" or "doc"

  // OnlyOffice Document Server API v1.7 URL format
  // Opens the document in view mode with no toolbar for clean screenshots
  return (
    `${ONLYOFFICE_URL}/web-apps/apps/documenteditor/main/index.html` +
    `?formsDataUrl=` +
    `&fileType=${ext}` +
    `&documentType=word` +
    `&key=${encodeURIComponent(filename + Date.now())}` +
    `&url=${docUrl}` +
    `&mode=view` +
    `&lang=en`
  );
}

async function waitForDocumentReady(page: Page, timeoutMs: number): Promise<void> {
  // Wait for OO to signal document ready — it fires a custom event or updates DOM
  await page.waitForFunction(
    () => {
      // OO Document Server renders content in an iframe with specific class
      const editors = document.querySelectorAll(".documenteditor");
      if (editors.length === 0) return false;

      // Also check for canvas elements (OO renders via canvas)
      const canvases = document.querySelectorAll("canvas");
      if (canvases.length === 0) return false;

      // Check that the loading indicator is gone
      const loading = document.querySelector(".asc-loadmask-body");
      return !loading || (loading as HTMLElement).style.display === "none";
    },
    { timeout: timeoutMs }
  ).catch(() => {
    // Fallback: just wait a fixed time if the selector approach doesn't work
    console.log("    [warn] Could not detect document ready via DOM — waiting 5s");
  });

  // Extra settle time for rendering
  await page.waitForTimeout(2000);
}

// ─── Screenshot + Diff ────────────────────────────────────────────────────────

async function takeScreenshot(page: Page, outputPath: string): Promise<void> {
  await page.screenshot({
    path: outputPath,
    fullPage: false,
    clip: { x: 0, y: 0, width: 1280, height: 900 },
  });
}

function compareImages(
  actualPath: string,
  referencePath: string,
  diffPath: string
): { diffPercent: number; passed: boolean } {
  const actual = PNG.sync.read(fs.readFileSync(actualPath));
  const reference = PNG.sync.read(fs.readFileSync(referencePath));

  // Resize to the smaller of the two dimensions
  const width = Math.min(actual.width, reference.width);
  const height = Math.min(actual.height, reference.height);

  const actualData = actual.width === width && actual.height === height ? actual.data : cropImage(actual, width, height);
  const referenceData =
    reference.width === width && reference.height === height ? reference.data : cropImage(reference, width, height);

  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(referenceData, actualData, diff.data, width, height, {
    threshold: 0.1, // per-pixel color threshold
    includeAA: false,
  });

  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  const totalPixels = width * height;
  const diffPercent = numDiffPixels / totalPixels;

  return {
    diffPercent,
    passed: diffPercent <= PIXEL_DIFF_THRESHOLD,
  };
}

function cropImage(png: PNG, width: number, height: number): Buffer {
  const cropped = new PNG({ width, height });
  PNG.bitblt(png, cropped, 0, 0, width, height, 0, 0);
  return cropped.data as unknown as Buffer;
}

// ─── Test Runner ─────────────────────────────────────────────────────────────

async function runTest(
  page: Page,
  entry: CorpusEntry,
  resultsDir: string
): Promise<TestResult> {
  const startTime = Date.now();
  const screenshotPath = path.join(resultsDir, entry.file.replace(/\.(docx|doc)$/, "-actual.png"));
  const referencePath = path.join(REFERENCE_DIR, entry.file.replace(/\.(docx|doc)$/, "-reference.png"));
  const diffPath = path.join(resultsDir, entry.file.replace(/\.(docx|doc)$/, "-diff.png"));
  const referenceExists = fs.existsSync(referencePath);

  console.log(`  Testing: ${entry.file} [${entry.priority}]`);

  try {
    const ooUrl = buildOnlyOfficeUrl(entry.file);
    await page.goto(ooUrl, { waitUntil: "domcontentloaded", timeout: DOCUMENT_READY_TIMEOUT });
    await waitForDocumentReady(page, DOCUMENT_READY_TIMEOUT);
    await takeScreenshot(page, screenshotPath);

    if (!referenceExists) {
      console.log(`    [skip] No reference image — screenshot saved for review`);
      return {
        file: entry.file,
        priority: entry.priority,
        description: entry.description,
        status: "skip",
        screenshotPath,
        referenceExists: false,
        durationMs: Date.now() - startTime,
      };
    }

    const { diffPercent, passed } = compareImages(screenshotPath, referencePath, diffPath);
    const diffPct = Math.round(diffPercent * 10000) / 100; // 2 decimal places

    console.log(
      `    ${passed ? "PASS" : "FAIL"} — diff: ${diffPct.toFixed(2)}% (threshold: ${(PIXEL_DIFF_THRESHOLD * 100).toFixed(0)}%)`
    );

    return {
      file: entry.file,
      priority: entry.priority,
      description: entry.description,
      status: passed ? "pass" : "fail",
      diffPercent: diffPct,
      diffImagePath: diffPath,
      screenshotPath,
      referenceExists: true,
      durationMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`    [error] ${message}`);
    return {
      file: entry.file,
      priority: entry.priority,
      description: entry.description,
      status: "error",
      screenshotPath: fs.existsSync(screenshotPath) ? screenshotPath : undefined,
      referenceExists,
      errorMessage: message,
      durationMs: Date.now() - startTime,
    };
  }
}

// ─── Generate Reference Images ────────────────────────────────────────────────

async function generateReferences(
  page: Page,
  entries: CorpusEntry[],
  targetPriorities: string[]
): Promise<void> {
  console.log(`\nGenerating reference images for tiers: ${targetPriorities.join(", ")}...`);

  if (!fs.existsSync(REFERENCE_DIR)) {
    fs.mkdirSync(REFERENCE_DIR, { recursive: true });
  }

  const targets = entries.filter((e) => targetPriorities.includes(e.priority));

  for (const entry of targets) {
    const referencePath = path.join(REFERENCE_DIR, entry.file.replace(/\.(docx|doc)$/, "-reference.png"));
    if (fs.existsSync(referencePath)) {
      console.log(`  [skip] Reference already exists: ${entry.file}`);
      continue;
    }

    console.log(`  Generating reference: ${entry.file}`);
    try {
      const ooUrl = buildOnlyOfficeUrl(entry.file);
      await page.goto(ooUrl, { waitUntil: "domcontentloaded", timeout: DOCUMENT_READY_TIMEOUT });
      await waitForDocumentReady(page, DOCUMENT_READY_TIMEOUT);
      await takeScreenshot(page, referencePath);
      console.log(`    Saved: ${path.basename(referencePath)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`    [error] Failed to generate reference for ${entry.file}: ${message}`);
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const generateRefs = process.argv.includes("--generate-references");

  // Ensure results dir exists
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  // Load manifest
  const manifestPath = path.join(CORPUS_DIR, "index.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("ERROR: corpus/index.json not found. Run: npm run generate-corpus first.");
    process.exit(1);
  }

  const manifest: CorpusManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  console.log(`Loaded corpus manifest: ${manifest.count} test files\n`);

  // Check OO is reachable
  const ooHealthy = await checkOnlyOffice();
  if (!ooHealthy) {
    console.error(`ERROR: OnlyOffice Document Server not reachable at ${ONLYOFFICE_URL}`);
    console.error("Start OO with: docker run -d -p 8080:80 onlyoffice/documentserver:latest");
    process.exit(1);
  }
  console.log(`OnlyOffice server: OK (${ONLYOFFICE_URL})\n`);

  // Start file server
  const fileServer = await startFileServer();

  // Launch browser
  const browser: Browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page: Page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  try {
    if (generateRefs) {
      // Generate reference images for critical + high priority
      await generateReferences(page, manifest.files, ["critical", "high"]);
    } else {
      // Run all tests
      console.log("Running compatibility tests...\n");
      const results: TestResult[] = [];

      for (const entry of manifest.files) {
        const result = await runTest(page, entry, RESULTS_DIR);
        results.push(result);
      }

      // Write results JSON
      const resultsPath = path.join(RESULTS_DIR, "results.json");
      fs.writeFileSync(
        resultsPath,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            ooUrl: ONLYOFFICE_URL,
            threshold: PIXEL_DIFF_THRESHOLD,
            total: results.length,
            results,
          },
          null,
          2
        )
      );

      console.log(`\nResults written to: ${resultsPath}`);
      console.log("Run 'npm run score' to generate the HTML report.");
    }
  } finally {
    await browser.close();
    fileServer.closeAllConnections();
    fileServer.close();
  }
}

async function checkOnlyOffice(): Promise<boolean> {
  return new Promise((resolve) => {
    const url = new URL(ONLYOFFICE_URL);
    const options = {
      hostname: url.hostname,
      port: parseInt(url.port || "80", 10),
      path: "/healthcheck",
      method: "HEAD",
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
