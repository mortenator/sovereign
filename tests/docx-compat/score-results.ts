/**
 * score-results.ts
 * Aggregates test results from results/results.json, groups by priority tier,
 * generates results/report.html and results/report.json, prints summary table,
 * and exits non-zero if below threshold.
 *
 * Exit codes:
 *   0 — all tiers meet threshold
 *   1 — Critical tier < 95% pass rate OR High tier < 90% pass rate
 */

import * as fs from "fs";
import * as path from "path";

// ─── Configuration ────────────────────────────────────────────────────────────

const CRITICAL_PASS_THRESHOLD = 0.95; // 95%
const HIGH_PASS_THRESHOLD = 0.90; // 90%
const RESULTS_DIR = path.join(__dirname, "results");
const RESULTS_JSON = path.join(RESULTS_DIR, "results.json");
const REPORT_HTML = path.join(RESULTS_DIR, "report.html");
const REPORT_JSON = path.join(RESULTS_DIR, "report.json");

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "critical" | "high" | "medium";
type Status = "pass" | "fail" | "skip" | "error";

interface TestResult {
  file: string;
  priority: Priority;
  description: string;
  status: Status;
  diffPercent?: number;
  diffImagePath?: string;
  screenshotPath?: string;
  referenceExists: boolean;
  errorMessage?: string;
  durationMs: number;
}

interface ResultsFile {
  timestamp: string;
  ooUrl: string;
  threshold: number;
  total: number;
  results: TestResult[];
}

interface TierSummary {
  tier: Priority;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  errored: number;
  passRate: number;
  threshold: number;
  meetsThreshold: boolean;
}

interface Report {
  generatedAt: string;
  runTimestamp: string;
  ooUrl: string;
  pixelDiffThreshold: number;
  tiers: TierSummary[];
  overall: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    errored: number;
    passRate: number;
  };
  results: TestResult[];
  passed: boolean;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function computeTier(results: TestResult[], tier: Priority, threshold: number): TierSummary {
  const tierResults = results.filter((r) => r.priority === tier);
  const passed = tierResults.filter((r) => r.status === "pass").length;
  const failed = tierResults.filter((r) => r.status === "fail").length;
  const skipped = tierResults.filter((r) => r.status === "skip").length;
  const errored = tierResults.filter((r) => r.status === "error").length;
  const evaluated = passed + failed + errored; // skip doesn't count toward pass rate

  // No evaluated tests means no reference images exist — treat as failure, not success
  if (evaluated === 0) {
    return { tier, total: tierResults.length, passed: 0, failed: 0, skipped, errored: 0, passRate: 0, threshold, meetsThreshold: false };
  }

  const passRate = passed / evaluated;

  return {
    tier,
    total: tierResults.length,
    passed,
    failed,
    skipped,
    errored,
    passRate,
    threshold,
    meetsThreshold: passRate >= threshold,
  };
}

// ─── HTML Report ──────────────────────────────────────────────────────────────

function statusBadge(status: Status): string {
  const map: Record<Status, { label: string; color: string }> = {
    pass: { label: "PASS", color: "#2e7d32" },
    fail: { label: "FAIL", color: "#c62828" },
    skip: { label: "SKIP", color: "#e65100" },
    error: { label: "ERROR", color: "#4a148c" },
  };
  const { label, color } = map[status];
  return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;">${label}</span>`;
}

function tierBadge(tier: Priority): string {
  const map: Record<Priority, { color: string; text: string }> = {
    critical: { color: "#b71c1c", text: "CRITICAL" },
    high: { color: "#e65100", text: "HIGH" },
    medium: { color: "#1565c0", text: "MEDIUM" },
  };
  const { color, text } = map[tier];
  return `<span style="background:${color};color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;">${text}</span>`;
}

function progressBar(rate: number, meetsThreshold: boolean): string {
  const pct = Math.round(rate * 100);
  const color = meetsThreshold ? "#2e7d32" : "#c62828";
  return `
    <div style="background:#eee;border-radius:4px;height:16px;width:200px;display:inline-block;vertical-align:middle;">
      <div style="background:${color};width:${pct}%;height:100%;border-radius:4px;"></div>
    </div>
    <span style="margin-left:8px;font-weight:bold;color:${color};">${pct}%</span>`;
}

function generateHTML(report: Report): string {
  const overallColor = report.passed ? "#2e7d32" : "#c62828";
  const overallText = report.passed ? "ALL THRESHOLDS MET" : "BELOW THRESHOLD";

  const tierRows = report.tiers
    .map(
      (t) => `
    <tr>
      <td>${tierBadge(t.tier)}</td>
      <td>${t.total}</td>
      <td style="color:#2e7d32;font-weight:bold;">${t.passed}</td>
      <td style="color:#c62828;font-weight:bold;">${t.failed}</td>
      <td style="color:#e65100;">${t.skipped}</td>
      <td style="color:#4a148c;">${t.errored}</td>
      <td>${progressBar(t.passRate, t.meetsThreshold)}</td>
      <td>${Math.round(t.threshold * 100)}%</td>
      <td>${t.meetsThreshold ? "✅" : "❌"}</td>
    </tr>`
    )
    .join("");

  const testRows = report.results
    .map((r) => {
      const diffCell =
        r.diffPercent !== undefined
          ? `${r.diffPercent.toFixed(2)}%${r.diffImagePath ? ` <a href="${path.basename(r.diffImagePath)}">[diff]</a>` : ""}`
          : r.status === "skip"
          ? "—"
          : r.errorMessage
          ? `<span style="color:#c62828;">${escapeHtml(r.errorMessage.slice(0, 80))}</span>`
          : "—";

      return `
    <tr>
      <td>${statusBadge(r.status)}</td>
      <td>${tierBadge(r.priority)}</td>
      <td><code>${escapeHtml(r.file)}</code></td>
      <td>${escapeHtml(r.description)}</td>
      <td>${diffCell}</td>
      <td>${r.referenceExists ? "✅" : "—"}</td>
      <td>${r.durationMs}ms</td>
    </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DOCX Compatibility Test Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #212121; background: #fafafa; }
    .header { background: #1a237e; color: white; padding: 24px 32px; }
    .header h1 { font-size: 24px; font-weight: 600; }
    .header p { margin-top: 6px; opacity: 0.8; font-size: 13px; }
    .overall-badge { display: inline-block; padding: 8px 20px; border-radius: 6px; font-size: 18px; font-weight: bold; color: white; background: ${overallColor}; margin-top: 16px; }
    .container { max-width: 1400px; margin: 0 auto; padding: 24px 32px; }
    h2 { font-size: 18px; color: #1a237e; margin: 24px 0 12px; border-bottom: 2px solid #e3f2fd; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.12); margin-bottom: 24px; }
    th { background: #1a237e; color: white; padding: 10px 14px; text-align: left; font-size: 13px; font-weight: 600; }
    td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8f9ff; }
    code { font-family: 'Courier New', monospace; font-size: 12px; background: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
    .meta { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.12); margin-bottom: 24px; display: flex; gap: 32px; flex-wrap: wrap; }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #757575; margin-bottom: 4px; }
    .meta-value { font-size: 16px; font-weight: 600; color: #212121; }
    a { color: #1565c0; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <h1>DOCX Compatibility Test Report</h1>
    <p>Project Sovereign — OnlyOffice rendering fidelity</p>
    <div class="overall-badge">${overallText}</div>
  </div>
  <div class="container">
    <div class="meta">
      <div class="meta-item">
        <span class="meta-label">Generated</span>
        <span class="meta-value">${new Date(report.generatedAt).toLocaleString()}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Test Run</span>
        <span class="meta-value">${new Date(report.runTimestamp).toLocaleString()}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">OnlyOffice URL</span>
        <span class="meta-value">${escapeHtml(report.ooUrl)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Pixel Diff Threshold</span>
        <span class="meta-value">${Math.round(report.pixelDiffThreshold * 100)}%</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Total Tests</span>
        <span class="meta-value">${report.overall.total}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Overall Pass Rate</span>
        <span class="meta-value" style="color:${overallColor};">${Math.round(report.overall.passRate * 100)}%</span>
      </div>
    </div>

    <h2>Tier Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Priority Tier</th>
          <th>Total</th>
          <th>Passed</th>
          <th>Failed</th>
          <th>Skipped</th>
          <th>Errors</th>
          <th>Pass Rate</th>
          <th>Required</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>${tierRows}</tbody>
    </table>

    <h2>Individual Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Priority</th>
          <th>File</th>
          <th>Description</th>
          <th>Pixel Diff</th>
          <th>Reference</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>${testRows}</tbody>
    </table>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Console Summary Table ────────────────────────────────────────────────────

function printSummary(report: Report): void {
  const line = "─".repeat(72);
  console.log(`\n${"═".repeat(72)}`);
  console.log(" DOCX COMPATIBILITY TEST REPORT");
  console.log(`${"═".repeat(72)}`);
  console.log(`  Run at:   ${new Date(report.runTimestamp).toLocaleString()}`);
  console.log(`  OO URL:   ${report.ooUrl}`);
  console.log(`  Tests:    ${report.overall.total} total`);
  console.log(`${line}`);
  console.log(` ${"TIER".padEnd(12)}${"PASS".padStart(6)}${"FAIL".padStart(6)}${"SKIP".padStart(6)}${"ERR".padStart(6)}  ${"RATE".padStart(8)}  ${"REQUIRED".padStart(10)}  RESULT`);
  console.log(`${line}`);

  for (const t of report.tiers) {
    const rateStr = `${Math.round(t.passRate * 100)}%`.padStart(8);
    const reqStr = `${Math.round(t.threshold * 100)}%`.padStart(10);
    const result = t.meetsThreshold ? "✅ OK" : "❌ FAIL";
    console.log(
      ` ${t.tier.toUpperCase().padEnd(12)}${String(t.passed).padStart(6)}${String(t.failed).padStart(6)}${String(t.skipped).padStart(6)}${String(t.errored).padStart(6)}  ${rateStr}  ${reqStr}  ${result}`
    );
  }

  console.log(`${line}`);
  console.log(
    ` ${"OVERALL".padEnd(12)}${String(report.overall.passed).padStart(6)}${String(report.overall.failed).padStart(6)}${String(report.overall.skipped).padStart(6)}${String(report.overall.errored).padStart(6)}  ${`${Math.round(report.overall.passRate * 100)}%`.padStart(8)}`
  );
  console.log(`${"═".repeat(72)}`);

  if (report.passed) {
    console.log(" RESULT: ALL THRESHOLDS MET ✅");
  } else {
    console.log(" RESULT: BELOW THRESHOLD ❌ — See report.html for details");
    for (const t of report.tiers) {
      if (!t.meetsThreshold) {
        console.log(`   ${t.tier.toUpperCase()} tier: ${Math.round(t.passRate * 100)}% < ${Math.round(t.threshold * 100)}% required`);
      }
    }
  }
  console.log(`${"═".repeat(72)}\n`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!fs.existsSync(RESULTS_JSON)) {
    console.error(`ERROR: ${RESULTS_JSON} not found. Run: npm run test first.`);
    process.exit(1);
  }

  const data: ResultsFile = JSON.parse(fs.readFileSync(RESULTS_JSON, "utf8"));

  // Compute tier summaries
  const criticalTier = computeTier(data.results, "critical", CRITICAL_PASS_THRESHOLD);
  const highTier = computeTier(data.results, "high", HIGH_PASS_THRESHOLD);
  const mediumTier = computeTier(data.results, "medium", 0.0); // No hard threshold for medium

  const allTiers = [criticalTier, highTier, mediumTier];

  const totalPassed = data.results.filter((r) => r.status === "pass").length;
  const totalFailed = data.results.filter((r) => r.status === "fail").length;
  const totalSkipped = data.results.filter((r) => r.status === "skip").length;
  const totalErrored = data.results.filter((r) => r.status === "error").length;
  const totalEvaluated = totalPassed + totalFailed + totalErrored;

  const overallPassRate = totalEvaluated > 0 ? totalPassed / totalEvaluated : 1.0;
  const passed = criticalTier.meetsThreshold && highTier.meetsThreshold;

  const report: Report = {
    generatedAt: new Date().toISOString(),
    runTimestamp: data.timestamp,
    ooUrl: data.ooUrl,
    pixelDiffThreshold: data.threshold,
    tiers: allTiers,
    overall: {
      total: data.total,
      passed: totalPassed,
      failed: totalFailed,
      skipped: totalSkipped,
      errored: totalErrored,
      passRate: overallPassRate,
    },
    results: data.results,
    passed,
  };

  // Write JSON report
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  console.log(`Report JSON written to: ${REPORT_JSON}`);

  // Write HTML report
  const html = generateHTML(report);
  fs.writeFileSync(REPORT_HTML, html);
  console.log(`Report HTML written to: ${REPORT_HTML}`);

  // Print summary
  printSummary(report);

  // Exit code
  if (!passed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
