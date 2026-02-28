import { useEditorStore } from '@/store/editorStore'
import { X, MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CommentsPanel() {
  const { toggleSidebarPanel } = useEditorStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Comments
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Add comment">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => toggleSidebarPanel('comments')}
            aria-label="Close comments panel"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Comments will be populated via OO SDK integration in a future milestone. */}
      <div className="flex flex-col items-center justify-center flex-1 py-8 gap-2 text-gray-400 dark:text-gray-500">
        <MessageSquare className="h-8 w-8" />
        <p className="text-xs">No comments yet</p>
      </div>
    </div>
  )
}
