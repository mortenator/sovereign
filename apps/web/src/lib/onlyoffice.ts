// Strip trailing slashes so env vars like VITE_OO_SERVER_URL=http://host/ don't
// produce double-slash URLs (e.g. http://host//web-apps/...).
const OO_SERVER_URL = (import.meta.env.VITE_OO_SERVER_URL ?? 'http://localhost:8080').replace(/\/$/, '')
const OO_API_SCRIPT = `${OO_SERVER_URL}/web-apps/apps/api/documents/api.js`
const APP_URL = (import.meta.env.VITE_APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')

// SECURITY: In production the JWT token MUST be signed server-side with the OO JWT secret
// and injected into this page — never bundle the secret in client code.
// For development against OO servers with JWT validation disabled, you can set
// VITE_OO_TOKEN to a pre-signed token. Leave unset in prod (use server-side injection).
const OO_JWT_TOKEN = import.meta.env.VITE_OO_TOKEN as string | undefined

// Warn loudly if a JWT token is bundled in a production build. Any VITE_* variable
// is inlined into the JS bundle and visible to anyone who views source — a bundled
// token lets users forge editor configs and bypass OO Document Server authorization.
if (import.meta.env.PROD && OO_JWT_TOKEN) {
  console.warn(
    '[Sovereign] SECURITY: VITE_OO_TOKEN is set in a production build. ' +
    'The token is visible in the JS bundle and can be used to forge editor configs. ' +
    'Inject the JWT token server-side instead of via environment variables.'
  )
}

export function getOOApiScriptUrl(): string {
  return OO_API_SCRIPT
}

export function generateDocumentKey(): string {
  // crypto.randomUUID() is cryptographically secure — Math.random() is not,
  // and predictable keys allow document enumeration attacks.
  return `doc_${crypto.randomUUID()}`
}

/** Ensure a URL is absolute. OO Document Server can't fetch relative URLs. */
function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${APP_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export function buildOOConfig({
  documentKey,
  documentUrl,
  documentTitle,
  callbackUrl,
  isDarkMode,
  userId = 'user-1',
  userName = 'Sovereign User',
}: {
  documentKey: string
  documentUrl: string
  documentTitle: string
  callbackUrl: string
  isDarkMode: boolean
  userId?: string
  userName?: string
}): OOConfig {
  return {
    // JWT token signed server-side. Required when OO Document Server has JWT enabled
    // (the default in production Docker images). Without it the server rejects the
    // config and the editor silently fails to load.
    ...(OO_JWT_TOKEN ? { token: OO_JWT_TOKEN } : {}),
    document: {
      fileType: 'docx',
      key: documentKey,
      title: documentTitle,
      url: toAbsoluteUrl(documentUrl),
      permissions: {
        comment: true,
        download: true,
        edit: true,
        print: true,
        review: true,
      },
    },
    documentType: 'word',
    editorConfig: {
      callbackUrl: toAbsoluteUrl(callbackUrl),
      lang: 'en',
      user: {
        id: userId,
        name: userName,
      },
      customization: {
        autosave: true,
        chat: false,
        compactHeader: true,
        compactToolbar: false,
        feedback: false,
        help: false,
        hideRightMenu: false,
        hideRulers: false,
        toolbarNoTabs: false,
        uiTheme: isDarkMode ? 'theme-dark' : 'theme-classic-light',
        zoom: 100,
      },
    },
    height: '100%',
    width: '100%',
    type: 'desktop',
  }
}

// SECURITY NOTE — no Subresource Integrity (SRI) on the OO API script:
// SRI requires a known compile-time hash, but the OO Document Server URL is
// runtime-configurable (VITE_OO_SERVER_URL), so the hash is unknowable at build
// time. Mitigation: serve the OO Document Server from a controlled, trusted host
// (your own infrastructure). Never point VITE_OO_SERVER_URL at a third-party host.
export function loadOOScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.DocsAPI) {
      resolve()
      return
    }

    const existingScript = document.querySelector(
      `script[src="${OO_API_SCRIPT}"]`
    ) as HTMLScriptElement | null

    if (existingScript) {
      // Script tag already in DOM — check terminal states first to avoid hanging
      if (window.DocsAPI) {
        resolve()
        return
      }
      if (existingScript.dataset.ooState === 'error') {
        reject(new Error('Failed to load OnlyOffice API script'))
        return
      }
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', () =>
        reject(new Error('Failed to load OnlyOffice API script'))
      )
      // Race guard: if the script's load event already fired between our checks
      // and listener attachment, DocsAPI will be set — resolve immediately.
      if (window.DocsAPI) resolve()
      return
    }

    const script = document.createElement('script')
    script.src = OO_API_SCRIPT
    script.onload = () => resolve()
    script.onerror = () => {
      script.dataset.ooState = 'error'
      reject(new Error(`Failed to load OnlyOffice API from ${OO_API_SCRIPT}`))
    }
    document.head.appendChild(script)
  })
}

// ── Connector cache ──────────────────────────────────────────────────────────
// createConnector() establishes an internal event subscription in the OO SDK.
// Calling it on every execOOMethod invocation leaks handles. We cache one
// connector per editor lifetime and replace it when the editor is recreated.

let _cachedConnector: OOConnector | null = null

/** Call once inside the editor's onDocumentReady event to cache the connector. */
export function initOOConnector(): void {
  _cachedConnector = window.editor?.createConnector?.() ?? null
}

/** Call when the editor is destroyed to release the cached connector. */
export function destroyOOConnector(): void {
  _cachedConnector = null
}

/**
 * Execute a method on the active OnlyOffice editor via the connector API.
 * Uses the cached connector (set up in onDocumentReady). Falls back to a
 * fresh createConnector() call when called before the cache is populated
 * (e.g., during early init).
 *
 * Method names follow the OO connector API convention (PascalCase):
 *   SetBold, SetItalic, SetUnderline, SetStrikeout,
 *   SetParagraphAlign (data: 'left'|'center'|'right'|'justify'),
 *   SetStyle (data: { Name: 'Heading 1' }),
 *   SetFontFamily (data: { Name: 'Arial' }),
 *   SetFontSize (data: { Size: 14 }),
 *   RemoveFormat, SetBullet, SetNum, Undo, Redo
 */
export function execOOMethod(
  methodName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: ((result?: any) => void) | null = null,
  data?: unknown
): void {
  try {
    const connector = _cachedConnector ?? window.editor?.createConnector?.()
    connector?.executeMethod(methodName, callback, data)
  } catch {
    // Editor not ready or method unsupported — safe to ignore
  }
}
