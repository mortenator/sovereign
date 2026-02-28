/**
 * Seed script: generates public/sample.docx
 * Run directly: tsx scripts/seed-docx.ts
 *
 * This script also runs automatically via the "prebuild" npm hook before every
 * `npm run build`. That is intentional: sample.docx must be present in public/
 * so Vite can bundle it as a static asset. The script is pure Node.js (no network
 * access, no user data) and is safe in CI/CD pipelines. It cannot be imported or
 * executed by browser code — it is excluded from the Vite build by residing under
 * scripts/ rather than src/.
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(__dirname, '../public/sample.docx')

// Ensure public directory exists
const publicDir = path.resolve(__dirname, '../public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

const borderStyle = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: 'CCCCCC',
}

const tableBorders = {
  top: borderStyle,
  bottom: borderStyle,
  left: borderStyle,
  right: borderStyle,
  insideHorizontal: borderStyle,
  insideVertical: borderStyle,
}

const doc = new Document({
  creator: 'Sovereign Editor',
  description: 'Sample document for Sovereign Editor',
  title: 'Project Sovereign — Sample Document',
  sections: [
    {
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: 'Project Sovereign — Sample Document',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),

        // Subtitle
        new Paragraph({
          children: [
            new TextRun({
              text: 'A demonstration of EU-sovereign document editing capabilities',
              italics: true,
              color: '555555',
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),

        // Introduction heading
        new Paragraph({
          text: '1. Introduction',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
        }),

        // Introduction body
        new Paragraph({
          children: [
            new TextRun({
              text: 'Project Sovereign is an ',
            }),
            new TextRun({
              text: 'EU-sovereign',
              bold: true,
            }),
            new TextRun({
              text: ' document editing platform built on OnlyOffice Document Server. It provides a ',
            }),
            new TextRun({
              text: 'modern, Word-like',
              italics: true,
            }),
            new TextRun({
              text: ' user experience while ensuring that all data remains within EU jurisdiction.',
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'The platform supports ',
            }),
            new TextRun({
              text: 'DOCX format',
              bold: true,
            }),
            new TextRun({
              text: ' natively, offering full compatibility with Microsoft Word documents. Users can collaborate in real-time, track changes, add comments, and export to multiple formats.',
            }),
          ],
          spacing: { after: 400 },
        }),

        // Key features heading
        new Paragraph({
          text: '2. Key Features',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
        }),

        // Heading 3
        new Paragraph({
          text: '2.1 Document Editing',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),

        // Bulleted list
        ...[
          'Full DOCX format support with round-trip fidelity',
          'Rich text formatting: bold, italic, underline, strikethrough',
          'Paragraph styles: Heading 1–6, Normal, Quote, Code',
          'Tables with merged cells and custom borders',
          'Images, charts, and embedded objects',
          'Headers, footers, and page numbering',
        ].map(
          (item) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: item,
                }),
              ],
              bullet: { level: 0 },
              spacing: { after: 80 },
            })
        ),

        new Paragraph({ spacing: { after: 200 } }),

        // Collaboration heading
        new Paragraph({
          text: '2.2 Collaboration',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 100 },
        }),

        // Numbered list
        ...[
          'Real-time co-editing with conflict-free merge',
          'Comments and review workflow',
          'Track changes with accept/reject',
          'Document history and version restore',
        ].map(
          (item, idx) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: `${idx + 1}. ${item}`,
                }),
              ],
              spacing: { after: 80 },
              indent: { left: 360 },
            })
        ),

        new Paragraph({ spacing: { after: 400 } }),

        // Table section
        new Paragraph({
          text: '3. Browser Compatibility',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Sovereign Editor is tested and supported across all major browsers:',
            }),
          ],
          spacing: { after: 200 },
        }),

        // Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: tableBorders,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: 'Browser', bold: true })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: tableBorders,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: 'Min Version', bold: true })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: tableBorders,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: 'Status', bold: true })],
                    }),
                  ],
                }),
              ],
            }),
            ...[
              ['Chrome', '90+', '✓ Fully supported'],
              ['Firefox', '88+', '✓ Fully supported'],
              ['Safari', '14+', '✓ Fully supported'],
              ['Edge', '90+', '✓ Fully supported'],
            ].map(
              ([browser, version, status]) =>
                new TableRow({
                  children: [
                    new TableCell({
                      borders: tableBorders,
                      children: [new Paragraph({ children: [new TextRun({ text: browser })] })],
                    }),
                    new TableCell({
                      borders: tableBorders,
                      children: [new Paragraph({ children: [new TextRun({ text: version })] })],
                    }),
                    new TableCell({
                      borders: tableBorders,
                      children: [new Paragraph({ children: [new TextRun({ text: status })] })],
                    }),
                  ],
                })
            ),
          ],
        }),

        new Paragraph({ spacing: { after: 400 } }),

        // Conclusion
        new Paragraph({
          text: '4. Conclusion',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Sovereign Editor demonstrates that ',
            }),
            new TextRun({
              text: 'world-class document editing',
              bold: true,
              italics: true,
            }),
            new TextRun({
              text: ' is achievable entirely within EU infrastructure. By building on top of OnlyOffice Document Server — itself an open-source, GDPR-compliant platform — we deliver a seamless editing experience without any dependency on US-origin cloud services.',
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'For technical documentation, see the project repository at ',
            }),
            new TextRun({
              text: 'github.com/sovereign-editor',
              color: '0066CC',
            }),
            new TextRun({
              text: '.',
            }),
          ],
          spacing: { after: 400 },
        }),
      ],
    },
  ],
})

async function main() {
  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(outputPath, buffer)
  console.log(`✓ Sample DOCX written to ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`)
}

main().catch((err) => {
  console.error('Failed to generate sample.docx:', err)
  process.exit(1)
})
