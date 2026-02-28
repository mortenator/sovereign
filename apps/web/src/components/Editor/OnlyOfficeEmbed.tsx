import { useEffect, useRef, useCallback } from 'react'
import { loadOOScript, buildOOConfig, initOOConnector, destroyOOConnector } from '@/lib/onlyoffice'
import { useEditorStore } from '@/store/editorStore'
import { useDocumentStore } from '@/store/documentStore'

interface OnlyOfficeEmbedProps {
  documentKey: string
  documentUrl: string
  documentTitle: string
  callbackUrl: string
  onReady?: () => void
  onStateChange?: (dirty: boolean) => void
  onError?: (code: number, description: string) => void
  onEditorCreated?: (editor: OOEditor) => void
}

/** Query word count via the OO SDK connector and update the document store. */
function queryWordCount(editorRef: React.RefObject<OOEditor | null>) {
  try {
    const conn = editorRef.current?.createConnector?.()
    conn?.executeMethod('GetWordsCount', (count: number) => {
      if (typeof count === 'number') {
        // Access Zustand store outside React tree — valid for event callbacks.
        useDocumentStore.getState().setWordCount(count)
      }
    })
  } catch {
    // GetWordsCount may not be available in all OO DS versions — safe to ignore.
  }
}

export function OnlyOfficeEmbed({
  documentKey,
  documentUrl,
  documentTitle,
  callbackUrl,
  onReady,
  onStateChange,
  onError,
  onEditorCreated,
}: OnlyOfficeEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<OOEditor | null>(null)
  const mountedRef = useRef(true)
  const { isDarkMode, setEditorLoading, setEditorError } = useEditorStore()

  // Track isDarkMode in a ref so initEditor can read the current value without
  // being in its dependency array. This prevents a destroy+reinit every time
  // the user toggles dark mode — OO theme changes take effect on next open.
  const isDarkModeRef = useRef(isDarkMode)
  useEffect(() => {
    isDarkModeRef.current = isDarkMode
  }, [isDarkMode])

  // Track mount state so async callbacks don't update state after unmount.
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const destroyEditor = useCallback(() => {
    if (editorInstanceRef.current) {
      try {
        editorInstanceRef.current.destroyEditor()
      } catch {
        // ignore destroy errors
      }
      editorInstanceRef.current = null
      window.editor = undefined
      destroyOOConnector()
    }
  }, [])

  const initEditor = useCallback(async () => {
    if (!containerRef.current) return

    setEditorLoading(true)
    destroyEditor()

    // Clear container and create fresh mount point
    containerRef.current.innerHTML = ''
    const editorDiv = document.createElement('div')
    editorDiv.id = 'onlyoffice-editor-container'
    editorDiv.style.height = '100%'
    editorDiv.style.width = '100%'
    containerRef.current.appendChild(editorDiv)

    try {
      await loadOOScript()
    } catch (err) {
      if (!mountedRef.current) return
      const msg = err instanceof Error ? err.message : 'Failed to load OnlyOffice'
      setEditorError(msg)
      onError?.(0, msg)
      return
    }

    if (!mountedRef.current) return

    if (!window.DocsAPI) {
      const msg = 'OnlyOffice Document Server not available. Is it running at localhost:8080?'
      setEditorError(msg)
      onError?.(0, msg)
      return
    }

    const baseConfig = buildOOConfig({
      documentKey,
      documentUrl,
      documentTitle,
      callbackUrl,
      isDarkMode: isDarkModeRef.current,
    })

    const fullConfig: OOConfig = {
      ...baseConfig,
      events: {
        onDocumentReady: () => {
          // Cache the connector here; creating it on every execOOMethod call
          // leaks SDK event subscriptions.
          initOOConnector()
          setEditorLoading(false)
          onReady?.()
          // Fetch initial word count once the document has fully loaded.
          queryWordCount(editorInstanceRef)
        },
        onDocumentStateChange: (e: { data: boolean }) => {
          onStateChange?.(e.data)
          // Update word count on every document change event.
          queryWordCount(editorInstanceRef)
        },
        onError: (e: { data: { errorCode: number; errorDescription: string } }) => {
          setEditorError(`Error ${e.data.errorCode}: ${e.data.errorDescription}`)
          onError?.(e.data.errorCode, e.data.errorDescription)
        },
      },
    }

    try {
      const editor = new window.DocsAPI.DocEditor('onlyoffice-editor-container', fullConfig)
      editorInstanceRef.current = editor
      window.editor = editor
      onEditorCreated?.(editor)
    } catch (err) {
      if (!mountedRef.current) return
      const msg = err instanceof Error ? err.message : 'Failed to initialize editor'
      setEditorError(msg)
      onError?.(0, msg)
    }
  }, [
    documentKey,
    documentUrl,
    documentTitle,
    callbackUrl,
    // isDarkMode intentionally excluded: changes handled via isDarkModeRef to
    // avoid destroying and recreating the editor on every theme toggle.
    onReady,
    onStateChange,
    onError,
    onEditorCreated,
    setEditorLoading,
    setEditorError,
    destroyEditor,
  ])

  useEffect(() => {
    initEditor()
    return () => {
      destroyEditor()
    }
  }, [initEditor, destroyEditor])

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      aria-label="Document editor"
    />
  )
}
