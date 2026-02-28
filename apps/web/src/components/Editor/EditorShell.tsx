import { useCallback, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useDocumentStore } from '@/store/documentStore'
import { OnlyOfficeEmbed } from './OnlyOfficeEmbed'
import { EditorErrorBoundary } from './EditorErrorBoundary'
import { OutlinePanel } from '@/components/Sidebar/OutlinePanel'
import { CommentsPanel } from '@/components/Sidebar/CommentsPanel'
import { StylesPanel } from '@/components/Sidebar/StylesPanel'
import { cn } from '@/lib/utils'
import { Loader2, AlertTriangle } from 'lucide-react'

export function EditorShell() {
  const {
    sidebarPanel,
    isEditorReady,
    isEditorLoading,
    editorError,
    setEditorReady,
    setEditorError,
  } = useEditorStore()

  const { documentKey, documentUrl, documentTitle, callbackUrl, setDirty } =
    useDocumentStore()

  // Incrementing this key forces EditorErrorBoundary (and its child) to fully
  // unmount and remount, giving a clean slate after a crash.
  const [editorMountKey, setEditorMountKey] = useState(0)

  // Stable callbacks — must not change on re-render or OO editor will reinitialize
  const handleReady = useCallback(() => setEditorReady(true), [setEditorReady])
  const handleError = useCallback(
    (code: number, desc: string) => setEditorError(`Error ${code}: ${desc}`),
    [setEditorError]
  )
  const handleEditorCreated = useCallback((editor: OOEditor) => {
    window.editor = editor
  }, [])

  const showOutline = sidebarPanel === 'outline'
  const showComments = sidebarPanel === 'comments'
  const showStyles = sidebarPanel === 'styles'
  const showSidebar = showOutline || showComments || showStyles

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-200 dark:bg-gray-700">
      {/* Left sidebar */}
      {showOutline && (
        <aside
          className="w-56 shrink-0 border-r border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-y-auto"
          aria-label="Document outline"
        >
          <OutlinePanel />
        </aside>
      )}
      {showStyles && (
        <aside
          className="w-56 shrink-0 border-r border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-y-auto"
          aria-label="Styles panel"
        >
          <StylesPanel />
        </aside>
      )}

      {/* Editor area */}
      <main
        className={cn(
          'relative flex-1 overflow-hidden',
          showSidebar ? 'min-w-0' : 'w-full'
        )}
        aria-label="Document editing area"
      >
        {/* Loading state */}
        {isEditorLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-gray-900 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading editor…
            </p>
          </div>
        )}

        {/* Error state */}
        {editorError && !isEditorReady && !isEditorLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-gray-900 gap-4 p-8">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <div className="text-center max-w-md">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Editor unavailable
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{editorError}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Start the OnlyOffice Document Server with{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                  docker compose up
                </code>{' '}
                from the{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">deploy/</code>{' '}
                directory.
              </p>
            </div>
          </div>
        )}

        <EditorErrorBoundary
          key={editorMountKey}
          onReset={() => setEditorMountKey((k) => k + 1)}
        >
          <OnlyOfficeEmbed
            documentKey={documentKey}
            documentUrl={documentUrl}
            documentTitle={documentTitle}
            callbackUrl={callbackUrl}
            onReady={handleReady}
            onStateChange={setDirty}
            onError={handleError}
            onEditorCreated={handleEditorCreated}
          />
        </EditorErrorBoundary>
      </main>

      {/* Right sidebar */}
      {showComments && (
        <aside
          className="w-64 shrink-0 border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-y-auto"
          aria-label="Comments panel"
        >
          <CommentsPanel />
        </aside>
      )}
    </div>
  )
}
