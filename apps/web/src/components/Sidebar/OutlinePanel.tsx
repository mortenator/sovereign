import { useEditorStore } from '@/store/editorStore'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeadingItem {
  id: string
  level: 1 | 2 | 3
  text: string
}

// Placeholder outline data; in production, populated from OO document events
const SAMPLE_OUTLINE: HeadingItem[] = [
  { id: '1', level: 1, text: 'Introduction' },
  { id: '2', level: 2, text: 'Background' },
  { id: '3', level: 2, text: 'Methodology' },
  { id: '4', level: 3, text: 'Data Collection' },
  { id: '5', level: 3, text: 'Analysis' },
  { id: '6', level: 1, text: 'Results' },
  { id: '7', level: 2, text: 'Findings' },
  { id: '8', level: 1, text: 'Conclusion' },
]

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
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Document outline">
        {SAMPLE_OUTLINE.map((item) => (
          <button
            key={item.id}
            className="w-full text-left px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            style={{
              paddingLeft: `${(item.level - 1) * 12 + 12}px`,
              fontWeight: item.level === 1 ? 600 : item.level === 2 ? 500 : 400,
            }}
            aria-label={`Go to ${item.text}`}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  )
}
