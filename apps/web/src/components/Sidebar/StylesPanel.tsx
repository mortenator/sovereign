import { useEditorStore } from '@/store/editorStore'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StyleDef {
  name: string
  preview: string
  tag: string
  className: string
}

const STYLES: StyleDef[] = [
  {
    name: 'Normal',
    preview: 'Normal text',
    tag: 'p',
    className: 'text-sm text-gray-800 dark:text-gray-200',
  },
  {
    name: 'Heading 1',
    preview: 'Heading 1',
    tag: 'h1',
    className: 'text-xl font-bold text-gray-900 dark:text-gray-100',
  },
  {
    name: 'Heading 2',
    preview: 'Heading 2',
    tag: 'h2',
    className: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
  },
  {
    name: 'Heading 3',
    preview: 'Heading 3',
    tag: 'h3',
    className: 'text-base font-medium text-gray-900 dark:text-gray-100',
  },
  {
    name: 'Subtitle',
    preview: 'Subtitle',
    tag: 'h4',
    className: 'text-sm font-medium text-gray-600 dark:text-gray-400',
  },
  {
    name: 'Quote',
    preview: '"Block quote text"',
    tag: 'blockquote',
    className: 'text-sm italic text-gray-600 dark:text-gray-400 border-l-2 border-gray-300 pl-2',
  },
  {
    name: 'Code',
    preview: 'code block',
    tag: 'pre',
    className: 'text-xs font-mono text-green-700 dark:text-green-400 bg-gray-100 dark:bg-gray-800 px-1 rounded',
  },
]

export function StylesPanel() {
  const { toggleSidebarPanel } = useEditorStore()

  const applyStyle = (tag: string) => {
    if (['h1', 'h2', 'h3', 'h4', 'p', 'blockquote', 'pre'].includes(tag)) {
      document.execCommand('formatBlock', false, tag)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Styles
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => toggleSidebarPanel('styles')}
          aria-label="Close styles panel"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2" role="listbox" aria-label="Paragraph styles">
        {STYLES.map((style) => (
          <button
            key={style.name}
            className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-800 transition-colors"
            onClick={() => applyStyle(style.tag)}
            role="option"
            aria-selected={false}
          >
            <div className={style.className}>{style.preview}</div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 block">
              {style.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
