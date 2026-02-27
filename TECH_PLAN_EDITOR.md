# Tech Plan: Core Editor & UX (apps/web)

## Goal
Build the `apps/web` React application — a modern Word-like editor shell that embeds OnlyOffice Document Server via its JS SDK. The result should look and feel like MS Word, not LibreOffice.

## Stack
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui (UI components)
- Zustand (state management)
- OnlyOffice Document Server JS SDK (`@onlyoffice/document-editor-react` or direct iframe embed)
- cmdk (command palette)

## File Structure to Build

```
apps/web/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── EditorShell.tsx        # Main layout wrapper
│   │   │   ├── OnlyOfficeEmbed.tsx    # OnlyOffice iframe/SDK component
│   │   │   └── index.ts
│   │   ├── Toolbar/
│   │   │   ├── Ribbon.tsx             # Tab-based ribbon (Home/Insert/Layout/Review/View)
│   │   │   ├── HomeTab.tsx
│   │   │   ├── InsertTab.tsx
│   │   │   ├── LayoutTab.tsx
│   │   │   ├── ReviewTab.tsx
│   │   │   ├── ViewTab.tsx
│   │   │   └── index.ts
│   │   ├── CommandPalette/
│   │   │   ├── CommandPalette.tsx     # Cmd+K palette using cmdk
│   │   │   └── commands.ts            # All available commands
│   │   ├── Sidebar/
│   │   │   ├── OutlinePanel.tsx       # Document outline nav
│   │   │   ├── CommentsPanel.tsx      # Comments sidebar
│   │   │   └── StylesPanel.tsx        # Styles picker
│   │   ├── StatusBar/
│   │   │   └── StatusBar.tsx          # Word count, zoom, page count
│   │   ├── FileManager/
│   │   │   ├── RecentDocuments.tsx
│   │   │   ├── NewDocumentDialog.tsx
│   │   │   └── SaveAsDialog.tsx
│   │   └── ui/                        # shadcn components
│   ├── hooks/
│   │   ├── useEditor.ts               # OnlyOffice SDK event bindings
│   │   ├── useKeyboardShortcuts.ts    # Word-compatible shortcuts
│   │   ├── useDocument.ts             # Document state
│   │   └── useDarkMode.ts
│   ├── store/
│   │   ├── editorStore.ts             # Zustand store for editor state
│   │   └── documentStore.ts
│   ├── lib/
│   │   ├── onlyoffice.ts              # OnlyOffice SDK wrapper + config
│   │   ├── fileUtils.ts               # File open/save helpers
│   │   └── shortcuts.ts               # Keyboard shortcut definitions
│   └── styles/
│       ├── globals.css
│       └── ribbon.css
```

## Key Components to Implement

### 1. OnlyOfficeEmbed.tsx
Embed OnlyOffice Document Server in an iframe using the DocsAPI.

```typescript
// Config for DocsAPI.DocEditor
const config = {
  document: {
    fileType: "docx",
    key: documentKey,    // unique per edit session
    title: fileName,
    url: documentUrl,    // presigned URL to fetch the DOCX
  },
  documentType: "word",
  editorConfig: {
    callbackUrl: callbackUrl,  // where OO posts save events
    customization: {
      autosave: true,
      compactHeader: true,
      toolbarNoTabs: false,
      uiTheme: darkMode ? "theme-dark" : "theme-classic-light",
      // Disable OO's own toolbar so we can replace with our ribbon:
      toolbar: false,   // NOTE: research if this flag exists; may need CSS override
    },
  },
  events: {
    onDocumentReady: handleDocumentReady,
    onDocumentStateChange: handleStateChange,
    onError: handleError,
  },
};
```

**Important:** If `toolbar: false` isn't supported, overlay our ribbon on top and hide OO's toolbar via CSS injection.

### 2. Ribbon.tsx
Tab-based toolbar matching MS Word's ribbon layout. Uses shadcn Tabs component.

Tabs: **Home | Insert | Layout | Review | View**

Home tab contents (most important):
- Clipboard group: Paste, Cut, Copy, Format Painter
- Font group: Font family dropdown, Size, Bold, Italic, Underline, Strikethrough, Color
- Paragraph group: Alignment (L/C/R/J), Line spacing, Bullets, Numbering, Indent
- Styles group: Style picker (Normal, Heading 1-3, etc.)
- Editing group: Find (opens sidebar), Replace

Each button calls the OnlyOffice SDK via `window.editor.executeMethod(...)` or uses document.execCommand as fallback.

### 3. CommandPalette.tsx
Using the `cmdk` library. Opens on Cmd+K (Mac) / Ctrl+K (Win).

Commands to include:
- All formatting actions (Bold, Italic, Underline, etc.)
- All styles (Heading 1, Heading 2, Body Text, etc.)
- All insert actions (Table, Image, Page Break, etc.)
- Navigation (Go to page, Find, Outline)
- View toggles (Dark mode, Zoom level, Show comments)
- File actions (Save, Save As, Export PDF, Print)

Search should be fuzzy and instant.

### 4. StatusBar.tsx
Bottom bar showing:
- Left: word count (live from OO events), page N of M
- Center: document title (editable on click)
- Right: zoom slider + presets (75%, 100%, 125%, 150%), view mode toggle

### 5. useKeyboardShortcuts.ts
Register global keyboard shortcuts matching MS Word:
- Cmd+S = Save
- Cmd+Shift+S = Save As
- Cmd+K = Command Palette
- Cmd+B = Bold
- Cmd+I = Italic
- Cmd+U = Underline
- Cmd+Z = Undo
- Cmd+Y = Redo
- Cmd+F = Find (open sidebar)
- Cmd+P = Print
- Cmd+E = Center align
- Cmd+L = Left align
- Cmd+R = Right align
- Cmd+J = Justify
- Cmd+Shift+> = Increase font size
- Cmd+Shift+< = Decrease font size
- Alt+1 = Apply Heading 1
- Alt+2 = Apply Heading 2
- Alt+3 = Apply Heading 3
- Esc = Close command palette / close find sidebar

### 6. App.tsx (layout)
```
┌──────────────────────────────────────────────────┐
│  App Header: Logo | File actions | Share | User  │
├──────────────────────────────────────────────────┤
│  Ribbon: [Home][Insert][Layout][Review][View]    │
│  [---- tab content: formatting buttons --------] │
├──────────────────────────────────────────────────┤
│  │Outline│       Editor Canvas (OO)    │Comments││
│  │Panel  │                             │Panel   ││
│  │(opt.) │                             │(opt.)  ││
├──────────────────────────────────────────────────┤
│  Status bar: words | page N/M | zoom slider      │
└──────────────────────────────────────────────────┘
```

Sidebars are collapsible. Default: collapsed. Show on demand.

## OnlyOffice SDK Integration Notes

For the OnlyOffice JS SDK to work in dev, you need the OO Document Server running. Use the Docker Compose config at `deploy/docker-compose/docker-compose.yml`.

The Document Server runs at `http://localhost:8080` in dev.

To init the editor:
```html
<script src="http://localhost:8080/web-apps/apps/api/documents/api.js"></script>
```

Then:
```javascript
const editor = new DocsAPI.DocEditor("editor-container", config);
```

## Dev Server Config
- Vite proxy: `/api` → `http://localhost:3001` (future API server)
- Vite proxy: `/ds` → `http://localhost:8080` (OnlyOffice Document Server)
- Port: 5173

## What to Deliver

1. `package.json` with all deps + scripts (dev, build, preview, lint)
2. Vite config with proxy setup
3. Full component tree as described above
4. Working dark mode toggle (CSS variables via Tailwind)
5. OnlyOffice embedded and loading a sample DOCX from `/public/sample.docx`
6. Ribbon with Home tab fully functional (font controls, styles, alignment all wired to OO SDK)
7. Command palette (Cmd+K) with all commands listed and searchable
8. All keyboard shortcuts registered and working
9. Status bar with word count and zoom
10. README in apps/web explaining how to run

## Sample DOCX
Add a `public/sample.docx` — create a minimal valid DOCX programmatically using `docx` npm package in a seed script, or download a public domain sample. It should have: headings, body paragraphs, a table, a bulleted list, and bold/italic formatting.

## Important Constraints
- No US-origin CDN dependencies (no Google Fonts — use local fonts or Bunny Fonts EU CDN as fallback)
- TypeScript strict mode
- All components accessible (ARIA labels, keyboard navigable)
- Works in Chrome, Firefox, Safari
