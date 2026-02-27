# Sovereign Editor — Web App

A modern EU-sovereign document editor built on OnlyOffice Document Server. Looks and feels like MS Word, runs entirely on EU infrastructure.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict mode) |
| Build tool | Vite 5 |
| Styling | Tailwind CSS + custom ribbon styles |
| State | Zustand |
| Editor engine | OnlyOffice Document Server (Docker) |
| Command palette | cmdk |
| UI primitives | Radix UI |

## Prerequisites

- **Node.js 18+**
- **Docker & Docker Compose** — for the OnlyOffice Document Server
- npm

## Getting Started

### 1. Start OnlyOffice Document Server

```bash
# From project root
cd deploy/docker-compose
docker compose up -d
```

Wait ~30 seconds for OnlyOffice to start, then verify at `http://localhost:8080/healthcheck`.

### 2. Install dependencies & start dev server

```bash
cd apps/web
npm install         # also auto-generates public/sample.docx
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. Generate sample document manually

```bash
npm run seed
```

Creates `public/sample.docx` with headings, body text, a table, a bulleted list, and rich formatting.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |
| `npm run seed` | Regenerate `public/sample.docx` |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── App.tsx                    # Root layout (header + ribbon + editor + status bar)
├── main.tsx                   # React entry point
├── components/
│   ├── Editor/
│   │   ├── EditorShell.tsx    # Main editor layout with optional sidebars
│   │   └── OnlyOfficeEmbed.tsx # OO Document Server iframe integration
│   ├── Toolbar/
│   │   ├── Ribbon.tsx         # Tab-based ribbon (Home/Insert/Layout/Review/View)
│   │   ├── HomeTab.tsx        # Font, paragraph, style, editing controls
│   │   ├── InsertTab.tsx      # Tables, images, links, headers
│   │   ├── LayoutTab.tsx      # Page setup, margins, columns
│   │   ├── ReviewTab.tsx      # Comments, track changes, spelling
│   │   └── ViewTab.tsx        # Zoom, outline, dark mode
│   ├── CommandPalette/
│   │   ├── CommandPalette.tsx # Cmd+K fuzzy-search command palette
│   │   └── commands.ts        # All available commands with actions
│   ├── Sidebar/
│   │   ├── OutlinePanel.tsx   # Document heading navigation
│   │   ├── CommentsPanel.tsx  # Review comments
│   │   └── StylesPanel.tsx    # Paragraph style picker
│   ├── StatusBar/
│   │   └── StatusBar.tsx      # Word count, page N/M, zoom slider
│   ├── FileManager/
│   │   ├── RecentDocuments.tsx
│   │   ├── NewDocumentDialog.tsx
│   │   └── SaveAsDialog.tsx
│   └── ui/                    # Radix UI-based components (Button, Select, etc.)
├── hooks/
│   ├── useEditor.ts           # OO SDK bindings and formatting commands
│   ├── useKeyboardShortcuts.ts # Word-compatible keyboard shortcuts
│   ├── useDocument.ts         # Document state accessor
│   └── useDarkMode.ts         # Dark mode toggle + system preference detection
├── store/
│   ├── editorStore.ts         # Zustand: UI state (ribbon, sidebars, dark mode)
│   └── documentStore.ts       # Zustand: document metadata (title, key, word count)
├── lib/
│   ├── onlyoffice.ts          # OO SDK loader + config builder
│   ├── fileUtils.ts           # File metadata helpers
│   ├── shortcuts.ts           # Keyboard shortcut definitions
│   └── utils.ts               # cn() Tailwind class merger
└── styles/
    ├── globals.css            # Tailwind base + CSS variables
    └── ribbon.css             # Ribbon-specific styles
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open Command Palette |
| `Cmd/Ctrl + S` | Save |
| `Cmd/Ctrl + Shift + S` | Save As / Export |
| `Cmd/Ctrl + B` | Bold |
| `Cmd/Ctrl + I` | Italic |
| `Cmd/Ctrl + U` | Underline |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Y` | Redo |
| `Cmd/Ctrl + F` | Find |
| `Cmd/Ctrl + L` | Align Left |
| `Cmd/Ctrl + E` | Center |
| `Cmd/Ctrl + R` | Align Right |
| `Cmd/Ctrl + J` | Justify |
| `Cmd/Ctrl + P` | Print |
| `Alt + 1/2/3` | Heading 1/2/3 |
| `Escape` | Close palette / find |

## OnlyOffice Integration

The editor loads via the OnlyOffice JS SDK (`DocsAPI.DocEditor`). Key points:

- The OO script is loaded dynamically from the Document Server at `http://localhost:8080`
- In production, set `VITE_OO_SERVER_URL` environment variable
- Document callback URL: `POST /api/docs/callback` (future API server)
- The document key must change on every new edit session to avoid cache collisions

### Environment Variables

```env
VITE_OO_SERVER_URL=http://localhost:8080    # OnlyOffice Document Server URL
```

## Dark Mode

Dark mode is toggled via:
- The moon/sun button in the app header
- The View ribbon tab
- The Command Palette → "Toggle Dark Mode"

Uses Tailwind `dark:` classes with a `dark` class on `<html>`. System preference is detected on first load.

## EU Sovereignty Notes

- No Google Fonts — uses system font stack
- No US CDN dependencies
- OnlyOffice Document Server is self-hosted
- All document data stays within your infrastructure
