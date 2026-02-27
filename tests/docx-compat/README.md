# DOCX Compatibility Test Suite

Automated test suite that generates a corpus of DOCX test files, renders them via
OnlyOffice Document Server, and scores pixel-level fidelity. Runs in CI on every push.

## Overview

```
tests/docx-compat/
├── generate-corpus.ts   # Generates 21 test DOCX files
├── run-tests.ts         # Playwright runner (renders + screenshots)
├── score-results.ts     # Aggregates results → HTML report
├── package.json
├── tsconfig.json
├── corpus/              # Generated .docx files (gitignored)
├── reference/           # Reference PNG renders (committed to git)
├── results/             # Test output PNGs + diff images (gitignored)
└── .github/workflows/
    └── docx-compat.yml  # CI workflow (also copied to repo root)
```

## Prerequisites

- **Node.js 20+**
- **OnlyOffice Document Server** running locally (for `npm run test`)

```bash
# Start OnlyOffice Document Server with Docker
docker run -d -p 8080:80 --name onlyoffice onlyoffice/documentserver:latest
```

Wait ~2 minutes for OO to initialize, then verify:
```bash
curl http://localhost:8080/healthcheck
# should return: true
```

## Running the Full Suite

```bash
cd tests/docx-compat
npm install

# Step 1: Generate the 21 test DOCX files
npm run generate-corpus

# Step 2: Run Playwright tests (requires OnlyOffice running)
npm run test

# Step 3: Score results + generate HTML report
npm run score
# Opens results/report.html
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ONLYOFFICE_URL` | `http://localhost:8080` | OnlyOffice Document Server URL |
| `FILE_SERVER_PORT` | `9090` | Port for the local DOCX file server |
| `PIXEL_DIFF_THRESHOLD` | `0.05` | Max allowed pixel diff (5%) for PASS |
| `DOCUMENT_READY_TIMEOUT` | `30000` | Timeout (ms) waiting for OO to render |

## Pass/Fail Thresholds

| Priority Tier | Required Pass Rate | Tests |
|---|---|---|
| **Critical** | ≥ 95% | Files 01–09 |
| **High** | ≥ 90% | Files 10–19 |
| **Medium** | (no hard threshold) | Files 20–21 |

CI exits with code `1` if Critical < 95% or High < 90%.

## Test Corpus (21 files)

### Critical Priority (01–09)

| File | Features Tested |
|---|---|
| `01-simple-prose.docx` | Title, Heading 1/2/3, body text, bold, italic, underline |
| `02-bulleted-list.docx` | Multi-level bullets, numbered list, indentation |
| `03-complex-table.docx` | 5×5 table, merged cells, colored headers, shading |
| `04-track-changes-insert.docx` | Tracked insertions from multiple authors |
| `05-track-changes-delete.docx` | Tracked deletions |
| `06-track-changes-format.docx` | Tracked formatting changes (bold/italic/underline) |
| `07-comments.docx` | 5 comments on different sections, multi-author |
| `08-headers-footers.docx` | Headers, footers, page numbers, first-page-different |
| `09-page-numbers.docx` | Multiple sections with independent page numbering |

### High Priority (10–19)

| File | Features Tested |
|---|---|
| `10-images-inline.docx` | Inline PNG images with figure captions |
| `11-images-floating.docx` | Floating images with square text wrap |
| `12-custom-styles.docx` | Custom paragraph styles: CustomHeading, CalloutBox, CodeBlock |
| `13-font-variety.docx` | Calibri, Arial, Times New Roman, Georgia, Courier New |
| `14-columns.docx` | Two-column layout with section breaks |
| `15-landscape-page.docx` | Mixed portrait + landscape sections |
| `16-footnotes.docx` | 5 footnotes with technical references |
| `17-toc.docx` | Auto-generated Table of Contents |
| `18-nested-table.docx` | Table inside a table cell |
| `19-long-document.docx` | 20+ page document with varied content |

### Medium Priority (20–21)

| File | Features Tested |
|---|---|
| `20-template-styles.docx` | Corporate template / dotx-style custom styles |
| `21-legacy-format.doc` | Legacy .doc extension (format detection) |

## Adding a New Test Case

1. **Add a generator function** in `generate-corpus.ts`:

```typescript
async function gen22MyNewFeature(): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "My Feature Test", heading: HeadingLevel.HEADING_1 }),
        // ... your content
      ],
    }],
  });

  await saveDoc(doc, "22-my-new-feature.docx");
  manifest.push({
    file: "22-my-new-feature.docx",
    priority: "high",           // "critical" | "high" | "medium"
    description: "Tests X and Y",
    features: ["feature-x", "feature-y"],
  });
}
```

2. **Call your function** in `main()`:
```typescript
console.log("\nHigh Priority:");
// ... existing calls ...
await gen22MyNewFeature();
```

3. **Regenerate corpus** and generate reference image:
```bash
npm run generate-corpus
# Then with OO running:
ONLY_FILE=22-my-new-feature.docx npx ts-node run-tests.ts --generate-references
```

4. **Commit** the reference PNG in `reference/22-my-new-feature-reference.png`.

## Generating Reference Images

Reference images are the "expected" renders. Generate them from OnlyOffice itself
(not from MS Word — the goal is regression detection, not Word fidelity validation):

```bash
# Generate references for all critical-tier files (only creates missing ones)
npx ts-node run-tests.ts --generate-references
```

Reference images are committed to git so CI can compare against them on future runs.
When OnlyOffice is updated, re-generate references and commit the new baselines.

## Interpreting Results

After `npm run score`:

- **`results/report.html`** — visual report with per-test pass/fail, diff percentages, links to diff images
- **`results/report.json`** — machine-readable summary
- **`results/*-actual.png`** — screenshots taken during test run
- **`results/*-diff.png`** — pixel diff image (red = changed pixels)

If a test fails:
1. Open `results/<file>-actual.png` to see what OO rendered
2. Open `results/<file>-diff.png` to see which pixels changed
3. Open `reference/<file>-reference.png` to see the expected render

## CI Integration

The GitHub Actions workflow (`.github/workflows/docx-compat.yml`) runs automatically on:
- Every push to `main`, `feat/*`, `fix/*` branches
- Every pull request targeting `main`

The workflow:
1. Starts OnlyOffice Document Server as a service container
2. Installs Node.js dependencies + Playwright
3. Generates the corpus
4. Generates reference images (if not in git)
5. Runs all tests
6. Generates HTML report
7. Uploads `results/` and `reference/` as artifacts (30-day retention)
8. Exits non-zero if thresholds not met

## Architecture Notes

- **File server**: A minimal Node.js HTTP server serves DOCX files from `corpus/` on port 9090. OnlyOffice fetches documents from this server via URL.
- **Screenshot comparison**: `pixelmatch` library does per-pixel RGBA comparison with configurable threshold. Anti-aliased pixels are excluded.
- **Diff images**: Red/orange pixels in diff images indicate changed pixels; the percentage shown is `(changed pixels) / (total pixels)`.
- **`.doc` file**: `21-legacy-format.doc` is OOXML content with a `.doc` extension — this tests format detection and fallback behavior in OO.
