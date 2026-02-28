// Strip trailing slashes so env vars like VITE_OO_SERVER_URL=http://host/ don't
// produce double-slash URLs (e.g. http://host//web-apps/...).
//
// SECURITY: Validate that both URLs use http/https. Non-http schemes (e.g.
// javascript:, data:) injected into a <script src> or as a callbackUrl would
// allow script injection or SSRF against the OO Document Server. Since these
// values come from Vite env vars (set at build time by developers/CI), we throw
// early to surface misconfiguration rather than silently serving a broken app.
const _rawOOServerUrl = import.meta.env.VITE_OO_SERVER_URL ?? 'http://localhost:8080'
if (!/^https?:\/\//i.test(_rawOOServerUrl)) {
  throw new Error(
    `[Sovereign] VITE_OO_SERVER_URL must start with http:// or https://. Got: "${_rawOOServerUrl}"`
  )
}
const OO_SERVER_URL = _rawOOServerUrl.replace(/\/$/, '')
const OO_API_SCRIPT = `${OO_SERVER_URL}/web-apps/apps/api/documents/api.js`

const _rawAppUrl = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'
if (import.meta.env.VITE_APP_URL && !/^https?:\/\//i.test(_rawAppUrl)) {
  throw new Error(
    `[Sovereign] VITE_APP_URL must start with http:// or https://. Got: "${_rawAppUrl}"`
  )
}
if (import.meta.env.PROD && !import.meta.env.VITE_APP_URL) {
  // The localhost fallback is only valid for local dev. In production the OO
  // Document Server calls this URL for save callbacks and document fetches —
  // it must be the public HTTPS URL of the app.
  console.warn(
    '[Sovereign] VITE_APP_URL is not set. Falling back to http://localhost:5173, ' +
    'which will not work in production. Set VITE_APP_URL to the public app URL.'
  )
}
const APP_URL = _rawAppUrl.replace(/\/$/, '')

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

// Shared promise used by all concurrent loadOOScript() callers. Without this,
// multiple rapid mounts (e.g. React Strict Mode double-invoke, tabs switching) each
// append their own <script> tag before any load event fires, causing duplicate OO
// SDK initialisation and unpredictable state.
let _ooScriptPromise: Promise<void> | null = null

export function loadOOScript(): Promise<void> {
  if (window.DocsAPI) return Promise.resolve()
  if (_ooScriptPromise) return _ooScriptPromise

  _ooScriptPromise = new Promise<void>((resolve, reject) => {
    // Re-check after promise construction — synchronous re-entrant callers may
    // have already resolved DocsAPI between the outer check and here.
    if (window.DocsAPI) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = OO_API_SCRIPT
    script.onload = () => resolve()
    script.onerror = () => {
      // Clear cache so the next call can retry (e.g. after network recovery).
      _ooScriptPromise = null
      reject(new Error(`Failed to load OnlyOffice API from ${OO_API_SCRIPT}`))
    }
    document.head.appendChild(script)
  })

  return _ooScriptPromise
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
  // Guard: if the connector hasn't been initialised yet (i.e. onDocumentReady
  // hasn't fired), return early instead of calling createConnector() which would
  // create a new SDK event subscription on every call and leak handles.
  if (!_cachedConnector) return
  try {
    _cachedConnector.executeMethod(methodName, callback, data)
  } catch {
    // Editor not ready or method unsupported — safe to ignore
  }
}
