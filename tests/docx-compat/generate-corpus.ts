/**
 * generate-corpus.ts
 * Generates 21 test DOCX files covering critical, high, and medium priority features.
 * Output: corpus/ directory with .docx files + corpus/index.json manifest.
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
  ShadingType,
  NumberFormat,
  LevelFormat,
  convertInchesToTwip,
  PageOrientation,
  SectionType,
  Header,
  Footer,
  ImageRun,
  TableOfContents,
  StyleLevel,
  FootnoteReferenceRun,
  UnderlineType,
  VerticalAlign,
  TableLayoutType,
  InsertedTextRun,
  DeletedTextRun,
  CommentRangeStart,
  CommentRangeEnd,
  CommentReference,
  TextWrappingType,
  TextWrappingSide,
  SimpleField,
} from "docx";
import * as fs from "fs";
import * as path from "path";

const CORPUS_DIR = path.join(__dirname, "corpus");

if (!fs.existsSync(CORPUS_DIR)) {
  fs.mkdirSync(CORPUS_DIR, { recursive: true });
}

interface CorpusEntry {
  file: string;
  priority: "critical" | "high" | "medium";
  description: string;
  features: string[];
}

const manifest: CorpusEntry[] = [];

async function saveDoc(doc: Document, filename: string): Promise<void> {
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(CORPUS_DIR, filename), buffer);
  console.log(`  Generated: ${filename} (${buffer.length} bytes)`);
}

async function gen01SimpleProse(): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: "Project Sovereign: Architecture Overview", heading: HeadingLevel.TITLE }),
          new Paragraph({ text: "Executive Summary", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            children: [
              new TextRun("Project Sovereign is a next-generation document processing platform designed to handle "),
              new TextRun({ text: "complex DOCX files", bold: true }),
              new TextRun(" with "),
              new TextRun({ text: "pixel-perfect fidelity", italics: true }),
              new TextRun(". This document outlines the core architectural decisions."),
            ],
          }),
          new Paragraph({ text: "Core Components", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            children: [
              new TextRun("The platform consists of several key components, each responsible for a specific aspect of document rendering. "),
              new TextRun({ text: "Rendering Engine", bold: true, underline: { type: UnderlineType.SINGLE } }),
              new TextRun(" handles the visual output, while the "),
              new TextRun({ text: "Format Parser", bold: true }),
              new TextRun(" processes the raw OOXML."),
            ],
          }),
          new Paragraph({ text: "Rendering Pipeline", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun("The rendering pipeline is "),
              new TextRun({ text: "critical", bold: true, italics: true }),
              new TextRun(" to the system's performance. It processes documents in three stages: parsing, layout, and rasterization."),
            ],
          }),
          new Paragraph({ text: "Data Flow", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun("Data flows from the client through the API gateway, into the processing queue, and finally to the rendering workers. Each step is "),
              new TextRun({ text: "independently scalable", underline: { type: UnderlineType.SINGLE } }),
              new TextRun(" to handle varying load conditions."),
            ],
          }),
          new Paragraph({ text: "API Design", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            children: [
              new TextRun("The RESTful API follows "),
              new TextRun({ text: "OpenAPI 3.0", bold: true }),
              new TextRun(" specification. All endpoints return "),
              new TextRun({ text: "JSON", italics: true }),
              new TextRun(" responses with standardized error codes."),
            ],
          }),
          new Paragraph({ text: "Conclusion", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            children: [
              new TextRun("Project Sovereign represents a significant advancement in document processing technology. The architecture is designed for "),
              new TextRun({ text: "reliability", bold: true }),
              new TextRun(", "),
              new TextRun({ text: "scalability", bold: true }),
              new TextRun(", and "),
              new TextRun({ text: "fidelity", bold: true }),
              new TextRun("."),
            ],
          }),
        ],
      },
    ],
  });
  await saveDoc(doc, "01-simple-prose.docx");
  manifest.push({ file: "01-simple-prose.docx", priority: "critical", description: "Title, Heading 1/2/3, body paragraphs, bold, italic, underline", features: ["headings", "bold", "italic", "underline", "paragraphs"] });
}

async function gen02BulletedList(): Promise<void> {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } } },
            { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(1.0), hanging: convertInchesToTwip(0.25) } } } },
            { level: 2, format: LevelFormat.BULLET, text: "\u25AA", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(0.25) } } } },
          ],
        },
        {
          reference: "numbered",
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } } },
            { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(1.0), hanging: convertInchesToTwip(0.25) } } } },
          ],
        },
      ],
    },
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Feature Requirements", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: "Core Features", numbering: { reference: "bullets", level: 0 } }),
        new Paragraph({ text: "Document rendering with pixel-perfect fidelity", numbering: { reference: "bullets", level: 1 } }),
        new Paragraph({ text: "Real-time collaboration support", numbering: { reference: "bullets", level: 1 } }),
        new Paragraph({ text: "Track changes visualization", numbering: { reference: "bullets", level: 2 } }),
        new Paragraph({ text: "Comment threading", numbering: { reference: "bullets", level: 2 } }),
        new Paragraph({ text: "Advanced Features", numbering: { reference: "bullets", level: 0 } }),
        new Paragraph({ text: "Custom style definitions", numbering: { reference: "bullets", level: 1 } }),
        new Paragraph({ text: "Complex table layouts", numbering: { reference: "bullets", level: 1 } }),
        new Paragraph({ text: "Nested tables", numbering: { reference: "bullets", level: 2 } }),
        new Paragraph({ text: "Merged cells with borders", numbering: { reference: "bullets", level: 2 } }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Implementation Steps", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: "Set up development environment", numbering: { reference: "numbered", level: 0 } }),
        new Paragraph({ text: "Install Node.js and TypeScript", numbering: { reference: "numbered", level: 1 } }),
        new Paragraph({ text: "Configure build toolchain", numbering: { reference: "numbered", level: 1 } }),
        new Paragraph({ text: "Implement core rendering engine", numbering: { reference: "numbered", level: 0 } }),
        new Paragraph({ text: "Build OOXML parser", numbering: { reference: "numbered", level: 1 } }),
        new Paragraph({ text: "Create layout engine", numbering: { reference: "numbered", level: 1 } }),
        new Paragraph({ text: "Write comprehensive test suite", numbering: { reference: "numbered", level: 0 } }),
        new Paragraph({ text: "Unit tests for each component", numbering: { reference: "numbered", level: 1 } }),
        new Paragraph({ text: "Integration tests with real documents", numbering: { reference: "numbered", level: 1 } }),
      ],
    }],
  });
  await saveDoc(doc, "02-bulleted-list.docx");
  manifest.push({ file: "02-bulleted-list.docx", priority: "critical", description: "Multi-level bullets + numbered list", features: ["bullets", "numbered-list", "multi-level-list", "indent"] });
}

async function gen03ComplexTable(): Promise<void> {
  const hdr = { type: ShadingType.SOLID, color: "2E74B5", fill: "2E74B5" };
  const alt = { type: ShadingType.SOLID, color: "D6E4F7", fill: "D6E4F7" };
  const h = (text: string) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], shading: hdr, verticalAlign: VerticalAlign.CENTER });
  const d = (text: string, sh = false) => new TableCell({ children: [new Paragraph({ text })], shading: sh ? alt : undefined });
  const dark = { type: ShadingType.SOLID, color: "263238", fill: "263238" };
  const tot = (text: string) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], shading: dark });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Q4 Performance Dashboard", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: "Regional Sales Summary", heading: HeadingLevel.HEADING_2 }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({ tableHeader: true, children: [h("Region"), h("Q1 Revenue"), h("Q2 Revenue"), h("Q3 Revenue"), h("Q4 Revenue")] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "North America (Merged)", bold: true })], alignment: AlignmentType.CENTER })], columnSpan: 5, shading: { type: ShadingType.SOLID, color: "E8F5E9", fill: "E8F5E9" } })] }),
            new TableRow({ children: [d("United States"), d("$4.2M"), d("$4.8M"), d("$5.1M"), d("$5.9M")] }),
            new TableRow({ children: [d("Canada", true), d("$1.1M", true), d("$1.3M", true), d("$1.4M", true), d("$1.6M", true)] }),
            new TableRow({ children: [d("Mexico"), d("$0.8M"), d("$0.9M"), d("$1.0M"), d("$1.2M")] }),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Europe", bold: true })], alignment: AlignmentType.CENTER })], rowSpan: 2, shading: { type: ShadingType.SOLID, color: "FFF9C4", fill: "FFF9C4" }, verticalAlign: VerticalAlign.CENTER }),
              d("$1.9M", true), d("$2.1M", true), d("$2.3M", true), d("$2.7M", true),
            ]}),
            new TableRow({ children: [d("$1.8M"), d("$2.0M"), d("$2.2M"), d("$1.5M")] }),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true })], alignment: AlignmentType.RIGHT })], shading: dark }),
              tot("$10.0M"), tot("$11.3M"), tot("$12.1M"), tot("$13.9M"),
            ]}),
          ],
        }),
      ],
    }],
  });
  await saveDoc(doc, "03-complex-table.docx");
  manifest.push({ file: "03-complex-table.docx", priority: "critical", description: "5x5 table with merged cells, colored headers, cell borders", features: ["table", "merged-cells", "column-span", "row-span", "shading", "table-header"] });
}

async function gen04TrackChangesInsert(): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Collaborative Document Review", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [
          new TextRun("The original text of this paragraph remains unchanged. "),
          new InsertedTextRun({ text: "This sentence was inserted by Alice on January 15th. ", id: 1, author: "Alice Johnson", date: "2024-01-15T10:30:00Z" }),
          new TextRun("The document continues with more content here."),
        ]}),
        new Paragraph({ children: [
          new TextRun("Project timelines have been reviewed. "),
          new InsertedTextRun({ text: "Bob added this critical note about Q2 deliverables being at risk. ", id: 2, author: "Bob Smith", date: "2024-01-16T14:00:00Z" }),
          new InsertedTextRun({ text: "Alice also added this follow-up clarification. ", id: 3, author: "Alice Johnson", date: "2024-01-16T15:30:00Z" }),
          new TextRun("Original text continues here."),
        ]}),
        new Paragraph({ text: "Technical Specifications", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [
          new TextRun("The API response time must be under 200ms. "),
          new InsertedTextRun({ text: "Charlie updated this: the new threshold is 150ms for critical endpoints. ", id: 4, author: "Charlie Davis", date: "2024-01-17T09:00:00Z" }),
          new TextRun("All other endpoints remain at 500ms."),
        ]}),
        new Paragraph({ children: [
          new InsertedTextRun({ text: "This entire paragraph was inserted by Dave as a new requirement section covering security compliance and data privacy regulations.", id: 5, author: "Dave Wilson", date: "2024-01-18T11:00:00Z" }),
        ]}),
      ],
    }],
  });
  await saveDoc(doc, "04-track-changes-insert.docx");
  manifest.push({ file: "04-track-changes-insert.docx", priority: "critical", description: "Paragraphs with tracked insertions from multiple authors", features: ["track-changes", "insertion", "revision", "multi-author"] });
}

async function gen05TrackChangesDelete(): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Document with Tracked Deletions", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [
          new TextRun("The project scope includes the following deliverables. "),
          new DeletedTextRun({ text: "This section about legacy system migration has been removed from scope. ", id: 1, author: "Alice Johnson", date: "2024-01-15T10:30:00Z" }),
          new TextRun("Focus remains on the core rendering engine."),
        ]}),
        new Paragraph({ children: [
          new DeletedTextRun({ text: "The deprecated API endpoints (v1.0 and v1.1) will no longer be supported. ", id: 2, author: "Bob Smith", date: "2024-01-16T14:00:00Z" }),
          new TextRun("All clients must migrate to v2.0 by the end of Q1."),
        ]}),
        new Paragraph({ text: "Budget Revisions", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [
          new TextRun("Total budget allocated: "),
          new DeletedTextRun({ text: "$500,000 ", id: 3, author: "Charlie Davis", date: "2024-01-17T09:00:00Z" }),
          new TextRun("$450,000 after reallocation to infrastructure."),
        ]}),
        new Paragraph({ children: [
          new DeletedTextRun({ text: "The external consulting firm contract has been terminated. This paragraph documents the reasons for termination including missed milestones and quality concerns. ", id: 4, author: "Dave Wilson", date: "2024-01-18T11:00:00Z" }),
          new TextRun("Internal resources will handle remaining deliverables."),
        ]}),
      ],
    }],
  });
  await saveDoc(doc, "05-track-changes-delete.docx");
  manifest.push({ file: "05-track-changes-delete.docx", priority: "critical", description: "Paragraphs with tracked deletions", features: ["track-changes", "deletion", "revision", "multi-author"] });
}

async function gen06TrackChangesFormat(): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Tracked Formatting Changes", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [
          new TextRun("This paragraph demonstrates tracked formatting changes. "),
          new TextRun({ text: "This text had bold formatting added by the reviewer. ", bold: true, revision: { id: 1, author: "Alice Johnson", date: "2024-01-15T10:30:00Z", bold: true } }),
          new TextRun("Normal text continues after the formatted section."),
        ]}),
        new Paragraph({ children: [
          new TextRun("The following phrase became italic: "),
          new TextRun({ text: "mission-critical infrastructure components", italics: true, revision: { id: 2, author: "Bob Smith", date: "2024-01-16T14:00:00Z", italics: true } }),
          new TextRun(", which required special handling."),
        ]}),
        new Paragraph({ children: [
          new TextRun("Underline was added to highlight "),
          new TextRun({ text: "important deadline: March 31, 2024", underline: { type: UnderlineType.SINGLE }, revision: { id: 3, author: "Charlie Davis", date: "2024-01-17T09:00:00Z", underline: { type: UnderlineType.SINGLE } } }),
          new TextRun(" for the stakeholders."),
        ]}),
      ],
    }],
  });
  await saveDoc(doc, "06-track-changes-format.docx");
  manifest.push({ file: "06-track-changes-format.docx", priority: "critical", description: "Tracked formatting changes: bold, italic, underline added", features: ["track-changes", "format-revision", "bold", "italic", "underline"] });
}

async function gen07Comments(): Promise<void> {
  const doc = new Document({
    comments: {
      children: [
        { id: 0, author: "Alice Johnson", date: new Date("2024-01-15T10:30:00Z"), children: [new Paragraph({ children: [new TextRun("This section needs more detail on the architecture decisions.")] })] },
        { id: 1, author: "Bob Smith", date: new Date("2024-01-16T14:00:00Z"), children: [new Paragraph({ children: [new TextRun("Agreed. Should we add a diagram here?")] })] },
        { id: 2, author: "Charlie Davis", date: new Date("2024-01-17T09:00:00Z"), children: [new Paragraph({ children: [new TextRun("The performance numbers look off. Please verify with the benchmark team.")] })] },
        { id: 3, author: "Dave Wilson", date: new Date("2024-01-18T11:00:00Z"), children: [new Paragraph({ children: [new TextRun("This table formatting doesn't match the brand guidelines.")] })] },
        { id: 4, author: "Eve Martinez", date: new Date("2024-01-19T16:00:00Z"), children: [new Paragraph({ children: [new TextRun("Great conclusion. Consider adding next steps section.")] })] },
      ],
    },
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Document Review: System Design Proposal", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new CommentRangeStart(0), new TextRun("The proposed architecture leverages microservices to achieve horizontal scalability. Each service is independently deployable and communicates via REST APIs."), new CommentRangeEnd(0), new CommentReference(0)] }),
        new Paragraph({ children: [new CommentRangeStart(1), new TextRun("The microservices approach enables independent scaling of each component, reducing operational costs during peak load periods."), new CommentRangeEnd(1), new CommentReference(1)] }),
        new Paragraph({ children: [new CommentRangeStart(2), new TextRun("Target response time is 150ms at the 99th percentile under 10,000 concurrent users. Memory footprint per instance should not exceed 512MB."), new CommentRangeEnd(2), new CommentReference(2)] }),
        new Paragraph({ text: "Data Model", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new CommentRangeStart(3), new TextRun("The primary data model uses a document-centric approach with JSONB storage in PostgreSQL for flexible schema evolution."), new CommentRangeEnd(3), new CommentReference(3)] }),
        new Paragraph({ text: "Conclusion", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new CommentRangeStart(4), new TextRun("The proposed system design balances performance, scalability, and maintainability. Implementation can proceed in three phases over the next two quarters."), new CommentRangeEnd(4), new CommentReference(4)] }),
      ],
    }],
  });
  await saveDoc(doc, "07-comments.docx");
  manifest.push({ file: "07-comments.docx", priority: "critical", description: "Document with 5 comments on different sections", features: ["comments", "comment-ranges", "multi-author"] });
}

async function gen08HeadersFooters(): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: { titlePage: true },
      headers: {
        default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "Project Sovereign", bold: true }), new TextRun(" | Confidential")], alignment: AlignmentType.RIGHT })] }),
        first: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "CONFIDENTIAL DOCUMENT", bold: true, color: "C00000" })], alignment: AlignmentType.CENTER })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ children: [new TextRun("© 2024 Project Sovereign Corp. All rights reserved. | Page "), new SimpleField("PAGE"), new TextRun(" of "), new SimpleField("NUMPAGES")], alignment: AlignmentType.CENTER })] }),
        first: new Footer({ children: [new Paragraph({ children: [new TextRun("First Page Footer — Do Not Distribute")], alignment: AlignmentType.CENTER })] }),
      },
      children: [
        new Paragraph({ text: "Headers and Footers Demo", heading: HeadingLevel.TITLE }),
        new Paragraph({ children: [new TextRun("This is the first page. It has a special first-page header and footer. The default header and footer appear on subsequent pages.")] }),
        new Paragraph({ text: "Section One", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.")] }),
        new Paragraph({ text: "Section Two", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("Sunt in culpa qui officia deserunt mollit anim id est laborum. The header and footer on this page use the default styles defined for this section.")] }),
      ],
    }],
  });
  await saveDoc(doc, "08-headers-footers.docx");
  manifest.push({ file: "08-headers-footers.docx", priority: "critical", description: "Headers, footers, page numbers (first page different)", features: ["header", "footer", "page-numbers", "first-page-different", "title-page"] });
}

async function gen09PageNumbers(): Promise<void> {
  type STVal = (typeof SectionType)[keyof typeof SectionType];
  const makeSection = (title: string, content: string, sType?: STVal) => ({
    properties: { type: sType, page: { pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
    footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun(`${title} — Page `), new SimpleField("PAGE")], alignment: AlignmentType.CENTER })] }) },
    children: [
      new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ children: [new TextRun(content)] }),
    ],
  });
  const doc = new Document({
    sections: [
      makeSection("Introduction", "This document demonstrates multiple page layout sections with independent page numbering."),
      makeSection("Chapter One", "First chapter content with page counter restarted at 1.", SectionType.NEXT_PAGE),
      makeSection("Chapter Two", "Second chapter demonstrating continued page number tracking.", SectionType.NEXT_PAGE),
    ],
  });
  await saveDoc(doc, "09-page-numbers.docx");
  manifest.push({ file: "09-page-numbers.docx", priority: "critical", description: "Multiple page layout sections with independent page numbering", features: ["page-numbers", "sections", "section-breaks", "page-restart"] });
}

async function gen10ImagesInline(): Promise<void> {
  const redPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const bluePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEElEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Inline Images Test Document", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("The following figure shows the primary architecture diagram:")] }),
        new Paragraph({ children: [new ImageRun({ data: redPng, transformation: { width: 400, height: 240 } })] }),
        new Paragraph({ children: [new TextRun({ text: "Figure 1: Architecture Diagram (inline PNG)", italics: true })], alignment: AlignmentType.CENTER }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun("The data flow is illustrated in Figure 2 below:")] }),
        new Paragraph({ children: [new ImageRun({ data: bluePng, transformation: { width: 300, height: 180 } })] }),
        new Paragraph({ children: [new TextRun({ text: "Figure 2: Data Flow Diagram (inline PNG)", italics: true })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun("Both images above are inline — they flow with the text and respect paragraph alignment.")] }),
      ],
    }],
  });
  await saveDoc(doc, "10-images-inline.docx");
  manifest.push({ file: "10-images-inline.docx", priority: "high", description: "Inline images (PNG) with figure captions", features: ["inline-image", "image-caption", "png"] });
}

async function gen11ImagesFloating(): Promise<void> {
  const redPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Floating Images Test", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [
          new ImageRun({ data: redPng, transformation: { width: 200, height: 150 }, floating: { horizontalPosition: { offset: 914400 }, verticalPosition: { offset: 914400 }, wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.RIGHT }, margins: { top: 114300, bottom: 114300, left: 114300, right: 114300 } } }),
          new TextRun("This paragraph contains text that wraps around a floating image positioned to the left. The image uses square wrapping, which means text flows in a rectangular path around the image boundary. This demonstrates how floating images interact with text flow in Word documents."),
        ]}),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun("Additional paragraph after the floating image to show text continuing normally below the image block.")] }),
      ],
    }],
  });
  await saveDoc(doc, "11-images-floating.docx");
  manifest.push({ file: "11-images-floating.docx", priority: "high", description: "Floating images with text wrap (square)", features: ["floating-image", "text-wrap", "square-wrap"] });
}

async function gen12CustomStyles(): Promise<void> {
  const doc = new Document({
    styles: {
      paragraphStyles: [
        { id: "CustomHeading", name: "Custom Heading", basedOn: "Heading1", next: "Normal", quickFormat: true, run: { size: 32, bold: true, color: "1B4F72", font: "Georgia" }, paragraph: { spacing: { before: 240, after: 120 } } },
        { id: "CalloutBox", name: "Callout Box", basedOn: "Normal", quickFormat: true, run: { size: 22, color: "1B4F72" }, paragraph: { indent: { left: convertInchesToTwip(0.5), right: convertInchesToTwip(0.5) }, spacing: { before: 120, after: 120 } } },
        { id: "CodeBlock", name: "Code Block", basedOn: "Normal", quickFormat: true, run: { size: 18, font: "Courier New", color: "212121" }, paragraph: { spacing: { before: 60, after: 60 }, indent: { left: convertInchesToTwip(0.5) } } },
      ],
    },
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Custom Styles Document", style: "CustomHeading" }),
        new Paragraph({ children: [new TextRun("This document uses custom paragraph styles defined in the style sheet. The heading above uses the 'Custom Heading' style with a Georgia font.")] }),
        new Paragraph({ children: [new TextRun("Note: Custom styles enable consistent formatting that can be applied document-wide and updated centrally.")], style: "CalloutBox" }),
        new Paragraph({ text: "Implementation Example", style: "CustomHeading" }),
        new Paragraph({ children: [new TextRun("Here is an example of the Code Block style:")] }),
        new Paragraph({ children: [new TextRun("const renderer = new DocumentRenderer({ fidelity: 'high' });")], style: "CodeBlock" }),
        new Paragraph({ children: [new TextRun("const result = await renderer.render(docxBuffer);")], style: "CodeBlock" }),
        new Paragraph({ children: [new TextRun("await result.save('./output.pdf');")], style: "CodeBlock" }),
        new Paragraph({ children: [new TextRun("The code block style uses a monospace font, making code samples easy to distinguish from regular prose.")] }),
      ],
    }],
  });
  await saveDoc(doc, "12-custom-styles.docx");
  manifest.push({ file: "12-custom-styles.docx", priority: "high", description: "Document using custom paragraph styles: CustomHeading, CalloutBox, CodeBlock", features: ["custom-styles", "style-inheritance", "fonts"] });
}

async function gen13FontVariety(): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Font Variety Test Document", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: "System Fonts", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun({ text: "Calibri (default): ", bold: true }), new TextRun({ text: "The quick brown fox jumps over the lazy dog. 1234567890", font: "Calibri" })] }),
        new Paragraph({ children: [new TextRun({ text: "Arial: ", bold: true }), new TextRun({ text: "The quick brown fox jumps over the lazy dog. 1234567890", font: "Arial" })] }),
        new Paragraph({ children: [new TextRun({ text: "Times New Roman: ", bold: true }), new TextRun({ text: "The quick brown fox jumps over the lazy dog. 1234567890", font: "Times New Roman" })] }),
        new Paragraph({ children: [new TextRun({ text: "Georgia: ", bold: true }), new TextRun({ text: "The quick brown fox jumps over the lazy dog. 1234567890", font: "Georgia" })] }),
        new Paragraph({ children: [new TextRun({ text: "Courier New: ", bold: true }), new TextRun({ text: "The quick brown fox jumps over the lazy dog. 1234567890", font: "Courier New" })] }),
        new Paragraph({ text: "Font Sizes", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun({ text: "8pt ", size: 16 }), new TextRun({ text: "10pt ", size: 20 }), new TextRun({ text: "12pt ", size: 24 }), new TextRun({ text: "14pt ", size: 28 }), new TextRun({ text: "18pt ", size: 36 }), new TextRun({ text: "24pt ", size: 48 }), new TextRun({ text: "36pt", size: 72 })] }),
        new Paragraph({ text: "Special Characters", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [
          new TextRun("Em dash \u2014 En dash \u2013 Ellipsis \u2026 "),
          new TextRun("Symbols: \u00A9 \u00AE \u2122 \u00B0 \u00B1 \u00D7 \u00F7 "),
          new TextRun("Accented: caf\u00E9 r\u00E9sum\u00E9 na\u00EFve Z\u00FCrich \u00C5ngstr\u00F6m"),
        ]}),
      ],
    }],
  });
  await saveDoc(doc, "13-font-variety.docx");
  manifest.push({ file: "13-font-variety.docx", priority: "high", description: "Multiple fonts including Calibri, Arial, Times New Roman, Georgia, Courier New", features: ["fonts", "font-size", "special-characters", "unicode"] });
}

async function gen14Columns(): Promise<void> {
  const doc = new Document({
    sections: [
      { properties: {}, children: [
        new Paragraph({ text: "Single Column Introduction", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("This introductory section uses the standard single-column layout. The following section will switch to a two-column layout.")] }),
      ]},
      { properties: { column: { space: 720, count: 2, equalWidth: true }, type: SectionType.NEXT_PAGE }, children: [
        new Paragraph({ text: "Two-Column Layout", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("This section uses a two-column layout. Text flows from the bottom of the first column to the top of the second column, just like a newspaper or magazine.")] }),
        new Paragraph({ children: [new TextRun("Column layouts are commonly used in newsletters, academic papers, and reference documents. They allow for more efficient use of page space.")] }),
        new Paragraph({ children: [new TextRun("Each column has equal width with consistent spacing between them. The gutter is set to 0.5 inches for comfortable reading.")] }),
      ]},
      { properties: { type: SectionType.NEXT_PAGE }, children: [
        new Paragraph({ text: "Return to Single Column", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("This final section returns to the standard single-column layout after the two-column section above.")] }),
      ]},
    ],
  });
  await saveDoc(doc, "14-columns.docx");
  manifest.push({ file: "14-columns.docx", priority: "high", description: "Two-column layout with section breaks", features: ["columns", "two-column", "section-break"] });
}

async function gen15LandscapePage(): Promise<void> {
  const doc = new Document({
    sections: [
      { properties: {}, children: [
        new Paragraph({ text: "Portrait Orientation (Default)", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("This section uses the standard portrait orientation (8.5\" x 11\").")] }),
      ]},
      { properties: { page: { size: { orientation: PageOrientation.LANDSCAPE, width: convertInchesToTwip(11), height: convertInchesToTwip(8.5) } }, type: SectionType.NEXT_PAGE }, children: [
        new Paragraph({ text: "Landscape Orientation — Wide Table", heading: HeadingLevel.HEADING_1 }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ tableHeader: true, children: ["Metric","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })], shading: { type: ShadingType.SOLID, color: "2E74B5", fill: "2E74B5" } })) }),
            new TableRow({ children: ["Revenue ($K)","120","135","142","158","171","189","201","195","212","228","241","260"].map(v => new TableCell({ children: [new Paragraph({ text: v })] })) }),
            new TableRow({ children: ["Users (K)","8.2","9.1","9.8","10.5","11.2","12.0","12.8","13.1","13.9","14.7","15.3","16.1"].map(v => new TableCell({ children: [new Paragraph({ text: v })] })) }),
          ],
        }),
      ]},
      { properties: { type: SectionType.NEXT_PAGE }, children: [
        new Paragraph({ text: "Return to Portrait", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("This section returns to portrait orientation after the landscape table section.")] }),
      ]},
    ],
  });
  await saveDoc(doc, "15-landscape-page.docx");
  manifest.push({ file: "15-landscape-page.docx", priority: "high", description: "Mixed portrait + landscape sections", features: ["landscape", "portrait", "page-orientation", "section-break"] });
}

async function gen16Footnotes(): Promise<void> {
  const doc = new Document({
    footnotes: {
      1: { children: [new Paragraph({ children: [new FootnoteReferenceRun(1), new TextRun(" Sovereign Architecture Review, Q4 2023, Internal Report #TR-2847.")] })] },
      2: { children: [new Paragraph({ children: [new FootnoteReferenceRun(2), new TextRun(" Performance benchmarks measured on AWS c5.4xlarge instances using Gatling 3.9.")] })] },
      3: { children: [new Paragraph({ children: [new FootnoteReferenceRun(3), new TextRun(" See RFC 9110 (HTTP Semantics) for the complete specification of HTTP/2 behavior.")] })] },
      4: { children: [new Paragraph({ children: [new FootnoteReferenceRun(4), new TextRun(" Data retention policies comply with GDPR Article 17 and CCPA Section 1798.105.")] })] },
      5: { children: [new Paragraph({ children: [new FootnoteReferenceRun(5), new TextRun(" Cost model assumes 70% average utilization across all compute instances.")] })] },
    },
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Technical Reference Document", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("The system architecture"), new FootnoteReferenceRun(1), new TextRun(" has been designed to handle sustained throughput of 50,000 requests per second.")] }),
        new Paragraph({ text: "Performance Analysis", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun("Benchmark results"), new FootnoteReferenceRun(2), new TextRun(" confirm that the p99 latency remains below 150ms even at peak load. HTTP/2 multiplexing"), new FootnoteReferenceRun(3), new TextRun(" reduces connection overhead by 40%.")] }),
        new Paragraph({ text: "Data Privacy", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun("All user data is subject to our retention policies"), new FootnoteReferenceRun(4), new TextRun(", which are reviewed quarterly by the legal team.")] }),
        new Paragraph({ text: "Cost Projections", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun("The total cost of ownership is estimated at $2.4M annually for the first deployment tier"), new FootnoteReferenceRun(5), new TextRun(". Subsequent tiers scale at approximately 60% of the initial cost.")] }),
      ],
    }],
  });
  await saveDoc(doc, "16-footnotes.docx");
  manifest.push({ file: "16-footnotes.docx", priority: "high", description: "Document with 5 footnotes referencing technical sources", features: ["footnotes", "footnote-references", "superscript"] });
}

async function gen17TOC(): Promise<void> {
  const doc = new Document({
    features: { updateFields: true },
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Comprehensive System Guide", heading: HeadingLevel.TITLE }),
        new Paragraph({ text: "Table of Contents", heading: HeadingLevel.HEADING_1 }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3", stylesWithLevels: [new StyleLevel("Heading1", 1), new StyleLevel("Heading2", 2), new StyleLevel("Heading3", 3)] }),
        new Paragraph({ text: "Introduction", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("This guide provides a comprehensive overview of the system architecture, configuration, and operational procedures.")] }),
        new Paragraph({ text: "Getting Started", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun("Prerequisites and initial setup steps are covered in this section.")] }),
        new Paragraph({ text: "Installation", heading: HeadingLevel.HEADING_3 }),
        new Paragraph({ children: [new TextRun("Step-by-step installation instructions for all supported platforms.")] }),
        new Paragraph({ text: "Architecture", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("The system is composed of several loosely-coupled microservices.")] }),
        new Paragraph({ text: "Core Services", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun("The rendering service, storage service, and API gateway form the core.")] }),
        new Paragraph({ text: "Operations", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("Day-to-day operational procedures and runbooks.")] }),
        new Paragraph({ text: "Deployment", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun("Deployment procedures using Kubernetes and Helm charts.")] }),
        new Paragraph({ text: "Troubleshooting", heading: HeadingLevel.HEADING_3 }),
        new Paragraph({ children: [new TextRun("Common issues and their resolutions.")] }),
      ],
    }],
  });
  await saveDoc(doc, "17-toc.docx");
  manifest.push({ file: "17-toc.docx", priority: "high", description: "Document with auto-generated Table of Contents", features: ["toc", "table-of-contents", "hyperlinks", "headings"] });
}

async function gen18NestedTable(): Promise<void> {
  const innerTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
    new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Sub-Item", bold: true })] })] }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true })] })] })] }),
    new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Alpha" })] }), new TableCell({ children: [new Paragraph({ text: "42" })] })] }),
    new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Beta" })] }), new TableCell({ children: [new Paragraph({ text: "87" })] })] }),
  ]});
  const innerTable2 = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
    new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Region A" })] }), new TableCell({ children: [new Paragraph({ text: "$1.2M" })] })] }),
    new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Region B" })] }), new TableCell({ children: [new Paragraph({ text: "$0.9M" })] })] }),
  ]});
  const blue = { type: ShadingType.SOLID, color: "2E74B5", fill: "2E74B5" };
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Nested Tables Test", heading: HeadingLevel.HEADING_1 }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          new TableRow({ tableHeader: true, children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true })] })], shading: blue }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Details (Nested Table)", bold: true })] })], shading: blue }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })], shading: blue }),
          ]}),
          new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Component A" })] }), new TableCell({ children: [innerTable] }), new TableCell({ children: [new Paragraph({ text: "Active" })] })] }),
          new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Revenue" })] }), new TableCell({ children: [innerTable2] }), new TableCell({ children: [new Paragraph({ text: "On track" })] })] }),
          new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Notes" })] }), new TableCell({ children: [new Paragraph({ text: "Plain cell — no nested table" })], columnSpan: 2 })] }),
        ]}),
      ],
    }],
  });
  await saveDoc(doc, "18-nested-table.docx");
  manifest.push({ file: "18-nested-table.docx", priority: "high", description: "Table inside a table cell (nested tables)", features: ["nested-table", "table", "complex-layout"] });
}

async function gen19LongDocument(): Promise<void> {
  const children: Paragraph[] = [];
  children.push(new Paragraph({ text: "Comprehensive Annual Report 2024", heading: HeadingLevel.TITLE }));
  const lorem = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit.",
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis dicta sunt explicabo.",
    "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate.",
  ];
  const sections = ["Executive Summary","Business Overview","Financial Performance","Product Development","Market Analysis","Operational Excellence","Risk Management","Technology Infrastructure","Human Resources","Customer Success","Strategic Initiatives","Regional Performance","Partnership Ecosystem","Regulatory Compliance","Future Outlook","Appendix A","Appendix B","Appendix C","Appendix D","Appendix E"];
  for (let i = 0; i < sections.length; i++) {
    children.push(new Paragraph({ text: sections[i], heading: i < 15 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2 }));
    const n = 2 + (i % 3);
    for (let j = 0; j < n; j++) {
      const runs: TextRun[] = [new TextRun(lorem[(i * n + j) % lorem.length] + " ")];
      if (j === 0) { runs.push(new TextRun({ text: `Section ${i + 1} key insight: `, bold: true }), new TextRun(`this metric improved by ${10 + i * 3}% year over year.`)); }
      children.push(new Paragraph({ children: runs }));
    }
    if (i % 3 === 0 && i < 15) {
      children.push(new Paragraph({ text: `${sections[i]} — Detail Analysis`, heading: HeadingLevel.HEADING_2 }));
      children.push(new Paragraph({ children: [new TextRun("Detailed analysis reveals consistent prior year trends, with notable exceptions documented in Appendix B.")] }));
    }
  }
  const doc = new Document({ sections: [{ properties: {}, children }] });
  await saveDoc(doc, "19-long-document.docx");
  manifest.push({ file: "19-long-document.docx", priority: "high", description: "20+ page document with variety of content, headings, and sub-sections", features: ["long-document", "headings", "multi-page", "pagination"] });
}

async function gen20TemplateStyles(): Promise<void> {
  const doc = new Document({
    styles: {
      paragraphStyles: [
        { id: "TitleCover", name: "Title Cover", basedOn: "Title", quickFormat: true, run: { bold: true, size: 56, color: "1A237E", font: "Calibri" }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 480, after: 240 } } },
        { id: "SubtitleCover", name: "Subtitle Cover", basedOn: "Subtitle", quickFormat: true, run: { size: 28, color: "283593", font: "Calibri", italics: true }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 480 } } },
        { id: "SectionDivider", name: "Section Divider", basedOn: "Heading1", quickFormat: true, run: { bold: true, allCaps: true, size: 24, color: "FFFFFF", font: "Calibri" }, paragraph: { spacing: { before: 240, after: 240 }, indent: { left: convertInchesToTwip(0.25), right: convertInchesToTwip(0.25) } } },
        { id: "BodyTextCustom", name: "Body Text Custom", basedOn: "Normal", quickFormat: true, run: { size: 22, font: "Calibri" }, paragraph: { spacing: { before: 80, after: 80, line: 276 } } },
      ],
    },
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Project Sovereign", style: "TitleCover" }),
        new Paragraph({ text: "Technical Architecture Template", style: "SubtitleCover" }),
        new Paragraph({ text: "Confidential — Internal Use Only", style: "BodyTextCustom" }),
        new Paragraph({ text: "SECTION 1: OVERVIEW", style: "SectionDivider" }),
        new Paragraph({ text: "This template document demonstrates custom dotx-style formatting. The styles defined here can be the basis for a corporate template.", style: "BodyTextCustom" }),
        new Paragraph({ text: "SECTION 2: ARCHITECTURE", style: "SectionDivider" }),
        new Paragraph({ text: "The architecture follows a service-oriented design pattern with clear boundaries between presentation, business logic, and data layers.", style: "BodyTextCustom" }),
        new Paragraph({ text: "SECTION 3: DEPLOYMENT", style: "SectionDivider" }),
        new Paragraph({ text: "Deployment is managed through a CI/CD pipeline using GitHub Actions and ArgoCD for Kubernetes cluster management.", style: "BodyTextCustom" }),
      ],
    }],
  });
  await saveDoc(doc, "20-template-styles.docx");
  manifest.push({ file: "20-template-styles.docx", priority: "medium", description: "Document using .dotx-style custom corporate template styles", features: ["template-styles", "custom-styles", "corporate-template", "all-caps"] });
}

async function gen21LegacyFormat(): Promise<void> {
  const doc = new Document({
    compatibility: { version: 12 },
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Legacy Format Document", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun("This document is saved in legacy Word 97-2003 (.doc) format. Modern viewers should be able to open and render it, though some advanced features may not be available.")] }),
        new Paragraph({ text: "Compatibility Notes", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun("The .doc binary format uses the Compound Document File Format (OLE2). Key differences from .docx include binary storage instead of ZIP+XML.")] }),
        new Paragraph({ text: "Test Content", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun("Normal text with "), new TextRun({ text: "bold", bold: true }), new TextRun(", "), new TextRun({ text: "italic", italics: true }), new TextRun(", and "), new TextRun({ text: "underlined", underline: { type: UnderlineType.SINGLE } }), new TextRun(" formatting.")] }),
      ],
    }],
  });
  const buffer = await Packer.toBuffer(doc);
  const filepath = path.join(CORPUS_DIR, "21-legacy-format.doc");
  fs.writeFileSync(filepath, buffer);
  console.log(`  Generated: 21-legacy-format.doc (${buffer.length} bytes) [DOCX content in .doc container]`);
  manifest.push({ file: "21-legacy-format.doc", priority: "medium", description: "Legacy Word 97-2003 .doc format (OOXML content with .doc extension)", features: ["legacy-format", "doc-extension", "compatibility"] });
}

async function main(): Promise<void> {
  console.log("Generating DOCX compatibility test corpus...\n");
  console.log("Critical Priority:");
  await gen01SimpleProse();
  await gen02BulletedList();
  await gen03ComplexTable();
  await gen04TrackChangesInsert();
  await gen05TrackChangesDelete();
  await gen06TrackChangesFormat();
  await gen07Comments();
  await gen08HeadersFooters();
  await gen09PageNumbers();
  console.log("\nHigh Priority:");
  await gen10ImagesInline();
  await gen11ImagesFloating();
  await gen12CustomStyles();
  await gen13FontVariety();
  await gen14Columns();
  await gen15LandscapePage();
  await gen16Footnotes();
  await gen17TOC();
  await gen18NestedTable();
  await gen19LongDocument();
  console.log("\nMedium Priority:");
  await gen20TemplateStyles();
  await gen21LegacyFormat();
  const manifestPath = path.join(CORPUS_DIR, "index.json");
  fs.writeFileSync(manifestPath, JSON.stringify({ generated: new Date().toISOString(), count: manifest.length, files: manifest }, null, 2));
  console.log(`\nManifest written to corpus/index.json`);
  const c = manifest.filter(f => f.priority === "critical").length;
  const h = manifest.filter(f => f.priority === "high").length;
  const m = manifest.filter(f => f.priority === "medium").length;
  console.log(`Total: ${manifest.length} test files generated.  Critical: ${c}  High: ${h}  Medium: ${m}`);
}

main().catch(err => { console.error("Error generating corpus:", err); process.exit(1); });
