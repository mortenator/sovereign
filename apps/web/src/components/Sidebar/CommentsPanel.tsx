import { useEditorStore } from '@/store/editorStore'
import { X, MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Comment {
  id: string
  author: string
  text: string
  date: string
  resolved: boolean
}

const SAMPLE_COMMENTS: Comment[] = [
  {
    id: '1',
    author: 'Alice Martin',
    text: 'Great introduction! Maybe add a brief overview of the methodology here.',
    date: '2 hours ago',
    resolved: false,
  },
  {
    id: '2',
    author: 'Bob Schmidt',
    text: 'The data in Table 1 needs to be updated with Q4 figures.',
    date: 'Yesterday',
    resolved: false,
  },
  {
    id: '3',
    author: 'Alice Martin',
    text: 'This section looks good now.',
    date: '3 days ago',
    resolved: true,
  },
]

export function CommentsPanel() {
  const { toggleSidebarPanel } = useEditorStore()

  const activeComments = SAMPLE_COMMENTS.filter((c) => !c.resolved)
  const resolvedComments = SAMPLE_COMMENTS.filter((c) => c.resolved)

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

      <div className="flex-1 overflow-y-auto">
        {activeComments.length === 0 && resolvedComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400 dark:text-gray-500">
            <MessageSquare className="h-8 w-8" />
            <p className="text-xs">No comments yet</p>
          </div>
        ) : (
          <>
            <div className="py-2">
              {activeComments.map((comment) => (
                <div
                  key={comment.id}
                  className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      {comment.author}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {comment.date}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{comment.text}</p>
                </div>
              ))}
            </div>

            {resolvedComments.length > 0 && (
              <details className="px-3 py-2">
                <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer">
                  {resolvedComments.length} resolved comment{resolvedComments.length > 1 ? 's' : ''}
                </summary>
                {resolvedComments.map((comment) => (
                  <div key={comment.id} className="py-2 opacity-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {comment.author}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {comment.date}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 line-through">
                      {comment.text}
                    </p>
                  </div>
                ))}
              </details>
            )}
          </>
        )}
      </div>
    </div>
  )
}
