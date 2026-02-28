const OO_SERVER_URL = import.meta.env.VITE_OO_SERVER_URL ?? 'http://localhost:8080'
const OO_API_SCRIPT = `${OO_SERVER_URL}/web-apps/apps/api/documents/api.js`
const APP_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'

export function getOOApiScriptUrl(): string {
  return OO_API_SCRIPT
}

export function generateDocumentKey(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
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

/**
 * Execute a method on the active OnlyOffice editor via the connector API.
 * The connector bridges the host page and the editor iframe using the
 * documented OO JS SDK approach (DocsAPI connector.executeMethod).
 *
 * Usage: execOOMethod('ChangeFont', null, { Name: 'Arial', Size: 14 })
 */
export function execOOMethod(
  methodName: string,
  callback: (() => void) | null = null,
  data?: unknown
): void {
  try {
    const connector = window.editor?.createConnector?.()
    connector?.executeMethod(methodName, callback, data)
  } catch {
    // Editor not ready or method unsupported — safe to ignore
  }
}
