import { useEffect, useRef, useCallback } from 'react'
import { loadOOScript, buildOOConfig, initOOConnector, destroyOOConnector, execOOMethod } from '@/lib/onlyoffice'
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

/** Query word count via the cached OO SDK connector and update the document store. */
function queryWordCount() {
  // Use execOOMethod (cached connector) — createConnector() on every call leaks SDK subscriptions.
  execOOMethod('GetWordsCount', (count: number) => {
    if (typeof count === 'number') {
      // Access Zustand store outside React tree — valid for event callbacks.
      useDocumentStore.getState().setWordCount(count)
    }
  })
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
  // Incremented on every initEditor invocation. Async continuations compare
  // against this value to detect stale initialisation (e.g. rapid prop changes
  // that trigger a new init before the previous one finishes loading the script).
  const initIdRef = useRef(0)
  const { isDarkMode, setEditorLoading, setEditorError } = useEditorStore()

  // Track isDarkMode in a ref so initEditor can read the current value without
  // being in its dependency array. This prevents a destroy+reinit every time
  // the user toggles dark mode — OO theme changes take effect on next open.
  const isDarkModeRef = useRef(isDarkMode)
  useEffect(() => {
    isDarkModeRef.current = isDarkMode
  }, [isDarkMode])

  // Track documentTitle in a ref for the same reason: renaming the document
  // must not destroy and recreate the OO editor (losing cursor position and
  // any un-autosaved state). The title is read once at init time by buildOOConfig.
  const documentTitleRef = useRef(documentTitle)
  useEffect(() => {
    documentTitleRef.current = documentTitle
  }, [documentTitle])

  // mountedRef is managed inside the single effect below — keeping mount
  // tracking and editor lifecycle in the same effect ensures their cleanup
  // order is deterministic and avoids the editorInstanceRef going stale.

  const destroyEditor = useCallback(() => {
    if (editorInstanceRef.current) {
      try {
        // OO SDK exposes destroyEditor() per API docs; older/variant builds may
        // use destroy(). Try both to be safe, wrapped in try/catch regardless.
        const inst = editorInstanceRef.current as OOEditor & { destroy?(): void }
        if (typeof inst.destroyEditor === 'function') {
          inst.destroyEditor()
        } else if (typeof inst.destroy === 'function') {
          inst.destroy()
        }
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

    // Stamp this invocation so stale async continuations can self-cancel.
    // Without this, a new initEditor() triggered by a prop change can race
    // with an in-flight loadOOScript() from a previous invocation, resulting
    // in two DocsAPI.DocEditor instances for the same container.
    const myId = ++initIdRef.current

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
      if (!mountedRef.current || initIdRef.current !== myId) {
        // Component unmounted or a newer init started while the script was
        // loading — reset loading flag so the store isn't stuck indefinitely.
        setEditorLoading(false)
        return
      }
      const msg = err instanceof Error ? err.message : 'Failed to load OnlyOffice'
      setEditorError(msg)
      onError?.(0, msg)
      return
    }

    if (!mountedRef.current || initIdRef.current !== myId) {
      setEditorLoading(false)
      return
    }

    if (!window.DocsAPI) {
      const msg = 'OnlyOffice Document Server not available. Is it running at localhost:8080?'
      setEditorError(msg)
      onError?.(0, msg)
      return
    }

    const baseConfig = buildOOConfig({
      documentKey,
      documentUrl,
      documentTitle: documentTitleRef.current,
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
          queryWordCount()
        },
        onDocumentStateChange: (e: { data: boolean }) => {
          onStateChange?.(e.data)
          // Update word count on every document change event.
          queryWordCount()
        },
        onError: (e: { data: { errorCode: number; errorDescription: string } }) => {
          setEditorError(`Error ${e.data.errorCode}: ${e.data.errorDescription}`)
          onError?.(e.data.errorCode, e.data.errorDescription)
        },
      },
    }

    try {
      const editor = new window.DocsAPI.DocEditor('onlyoffice-editor-container', fullConfig)
      if (!mountedRef.current || initIdRef.current !== myId) {
        // A newer init started between DocsAPI construction and now — clean up
        // the editor we just created rather than tracking a stale instance.
        try {
          (editor as OOEditor & { destroy?(): void }).destroyEditor?.()
        } catch { /* ignore */ }
        return
      }
      editorInstanceRef.current = editor
      window.editor = editor
      onEditorCreated?.(editor)
    } catch (err) {
      if (!mountedRef.current || initIdRef.current !== myId) return
      const msg = err instanceof Error ? err.message : 'Failed to initialize editor'
      setEditorError(msg)
      onError?.(0, msg)
    }
  }, [
    documentKey,
    documentUrl,
    // documentTitle intentionally excluded: changes handled via documentTitleRef to
    // avoid destroying and recreating the editor on every rename (losing cursor
    // position and un-autosaved state). isDarkMode excluded for the same reason.
    callbackUrl,
    onReady,
    onStateChange,
    onError,
    onEditorCreated,
    setEditorLoading,
    setEditorError,
    destroyEditor,
  ])

  // Single effect for both mount-state tracking and editor lifecycle. Keeping
  // them together ensures mountedRef is set to false *before* destroyEditor()
  // runs in the same cleanup pass, so any in-flight async init sees a
  // consistent view of both flags (mountedRef and initIdRef) regardless of
  // React's effect cleanup ordering across separate effects.
  useEffect(() => {
    mountedRef.current = true
    initEditor()
    return () => {
      mountedRef.current = false
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
