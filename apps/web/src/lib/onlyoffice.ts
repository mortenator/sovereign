const OO_SERVER_URL = import.meta.env.VITE_OO_SERVER_URL ?? 'http://localhost:8080'
const OO_API_SCRIPT = `${OO_SERVER_URL}/web-apps/apps/api/documents/api.js`

export function getOOApiScriptUrl(): string {
  return OO_API_SCRIPT
}

export function generateDocumentKey(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
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
      url: documentUrl,
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
      callbackUrl,
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

    const existingScript = document.querySelector(`script[src="${OO_API_SCRIPT}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', () =>
        reject(new Error('Failed to load OnlyOffice API script'))
      )
      return
    }

    const script = document.createElement('script')
    script.src = OO_API_SCRIPT
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error(`Failed to load OnlyOffice API from ${OO_API_SCRIPT}`))
    document.head.appendChild(script)
  })
}

export function execFormat(command: string, value?: string): boolean {
  try {
    return document.execCommand(command, false, value ?? '')
  } catch {
    return false
  }
}
