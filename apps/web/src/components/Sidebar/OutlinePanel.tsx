import { useEditorStore } from '@/store/editorStore'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OutlinePanel() {
  const { toggleSidebarPanel } = useEditorStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Outline
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => toggleSidebarPanel('outline')}
          aria-label="Close outline panel"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
          Document outline will appear here as you add headings.
        </p>
      </div>
    </div>
  )
}
