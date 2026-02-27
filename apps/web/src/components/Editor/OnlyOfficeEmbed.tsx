import { useEffect, useRef, useCallback } from 'react'
import { loadOOScript, buildOOConfig } from '@/lib/onlyoffice'
import { useEditorStore } from '@/store/editorStore'

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
  const { isDarkMode, setEditorLoading, setEditorError } = useEditorStore()

  const destroyEditor = useCallback(() => {
    if (editorInstanceRef.current) {
      try {
        editorInstanceRef.current.destroyEditor()
      } catch {
        // ignore destroy errors
      }
      editorInstanceRef.current = null
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
      const msg = err instanceof Error ? err.message : 'Failed to load OnlyOffice'
      setEditorError(msg)
      onError?.(0, msg)
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
      documentTitle,
      callbackUrl,
      isDarkMode,
    })

    const fullConfig: OOConfig = {
      ...baseConfig,
      events: {
        onDocumentReady: () => {
          setEditorLoading(false)
          onReady?.()
        },
        onDocumentStateChange: (e: { data: boolean }) => {
          onStateChange?.(e.data)
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
      const msg = err instanceof Error ? err.message : 'Failed to initialize editor'
      setEditorError(msg)
      onError?.(0, msg)
    }
  }, [
    documentKey,
    documentUrl,
    documentTitle,
    callbackUrl,
    isDarkMode,
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
