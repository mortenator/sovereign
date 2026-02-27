# Tech Plan: DOCX Compatibility Test Suite (tests/docx-compat)

## Goal
Build an automated test suite that generates a corpus of DOCX test files, renders them via OnlyOffice Document Server, and scores fidelity. Run in CI on every release.

## Stack
- Node.js + TypeScript
- `docx` npm package (generate test DOCX files programmatically)
- Playwright (render documents in OO Document Server, take screenshots)
- `pixelmatch` (pixel-diff two PNGs)
- MS Word reference renders: pre-generate PNGs using a local Word/LibreOffice install

## File Structure

```
tests/docx-compat/
├── package.json
├── tsconfig.json
├── generate-corpus.ts     # Generate all test DOCX files
├── run-tests.ts           # Main test runner
├── score-results.ts       # Aggregate scores + generate report
├── corpus/                # Generated .docx files (gitignored, generated fresh)
├── reference/             # Reference PNG renders (committed to git)
├── results/               # Test output PNGs + diff images (gitignored)
└── README.md
```

## Test Cases to Generate (generate-corpus.ts)

Generate these DOCX files programmatically using the `docx` npm package:

### Critical Priority
1. `01-simple-prose.docx` - Title, Heading 1/2/3, body paragraphs, bold, italic, underline
2. `02-bulleted-list.docx` - Multi-level bullets + numbered list
3. `03-complex-table.docx` - 5x5 table, merged cells, colored headers, cell borders
4. `04-track-changes-insert.docx` - Paragraphs with tracked insertions (multi-author)
5. `05-track-changes-delete.docx` - Paragraphs with tracked deletions
6. `06-track-changes-format.docx` - Tracked formatting changes (bold added/removed)
7. `07-comments.docx` - Document with 5 comments on different sections
8. `08-headers-footers.docx` - Headers, footers, page numbers (first page different)
9. `09-page-numbers.docx` - Multiple page layout sections, page numbers

### High Priority
10. `10-images-inline.docx` - Inline images (PNG, JPG) with captions
11. `11-images-floating.docx` - Floating images with text wrap (square, tight)
12. `12-custom-styles.docx` - Document using custom paragraph styles
13. `13-font-variety.docx` - Multiple fonts including Calibri (expect substitution)
14. `14-columns.docx` - Two-column layout with section breaks
15. `15-landscape-page.docx` - Mixed portrait + landscape sections
16. `16-footnotes.docx` - Document with 5 footnotes
17. `17-toc.docx` - Document with table of contents
18. `18-nested-table.docx` - Table inside a table cell
19. `19-long-document.docx` - 20 pages, variety of content

### Medium Priority
20. `20-template-styles.docx` - Document using .dotx-style custom styles
21. `21-legacy-format.doc` - Legacy Word 97-2003 format (binary .doc)

## run-tests.ts Logic

For each test file:
1. Upload DOCX to MinIO (or serve from local file server)
2. Open in OnlyOffice Document Server via Playwright
3. Wait for `onDocumentReady` event
4. Take full-page screenshot of first N pages
5. Compare to reference PNG using pixelmatch
6. Record: pixel diff %, pass/fail, diff image path
7. Also: save the round-trip DOCX (OO auto-saves) and do XML diff vs original

## score-results.ts Logic

After all tests run:
- Group by priority tier
- Calculate: pass rate per tier, overall pass rate
- Generate `results/report.json` + `results/report.html`
- Print summary table to stdout
- Exit code 1 if Critical tier < 95% pass rate
- Exit code 1 if High tier < 90% pass rate

## CI Integration (GitHub Actions)

```yaml
# .github/workflows/docx-compat.yml
name: DOCX Compatibility
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      onlyoffice:
        image: onlyoffice/documentserver:latest
        ports:
          - 8080:80
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd tests/docx-compat && npm install
      - run: cd tests/docx-compat && npm run generate-corpus
      - run: cd tests/docx-compat && npm run test
      - uses: actions/upload-artifact@v4
        with:
          name: docx-compat-results
          path: tests/docx-compat/results/
```

## What to Deliver

1. `generate-corpus.ts` creating all 21 test DOCX files
2. `run-tests.ts` Playwright-based test runner
3. `score-results.ts` scoring + HTML report generator
4. `package.json` with all deps + npm scripts
5. Reference renders (PNG) for first 9 critical test cases (generate these by running OO headlessly)
6. GitHub Actions workflow at `.github/workflows/docx-compat.yml`
7. `README.md` explaining how to add new test cases

## Note on Reference Renders
For MVP, generate reference renders by running OO Document Server itself (no MS Word needed). The goal is regression testing — detecting when Sovereign's rendering changes unexpectedly. True fidelity vs Word requires manual baseline creation later.
