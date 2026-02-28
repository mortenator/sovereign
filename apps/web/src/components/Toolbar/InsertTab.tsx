import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Table,
  Image,
  FileText,
  Link,
  Minus,
  Hash,
  SquareCode,
  BookOpen,
} from 'lucide-react'
import { execOOMethod } from '@/lib/onlyoffice'

function InsertBtn({
  label,
  icon: Icon,
  onClick,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ribbon"
          size="sm"
          onClick={onClick}
          aria-label={label}
          className="flex-col h-12 w-14 gap-0.5 text-[10px]"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function InsertGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-stretch">
      <div className="flex items-center gap-0.5 px-1">{children}</div>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-0.5 px-1">
        {label}
      </span>
    </div>
  )
}

// OO SDK does not expose a connector method for this action — direct the user to the editor UI.
function notAvailable(feature: string) {
  alert(`"${feature}" is not available via the ribbon.\nUse the Format menu inside the editor.`)
}

export function InsertTab() {
  // Kept for future local-file upload once a backend upload endpoint exists.
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleInsertTable = () => {
    execOOMethod('InsertTable', null, { Rows: 3, Cols: 3 })
  }

  const handleInsertImage = () => {
    // OO Document Server must fetch the image URL, so a local blob: URL won't work.
    // Until a backend upload endpoint is available, prompt for a public image URL.
    const url = window.prompt('Enter image URL (must be publicly accessible):')
    if (url?.trim()) {
      execOOMethod('InsertImage', null, { c: 'add', Images: [{ ImageUrl: url.trim() }] })
    }
  }

  return (
    <div className="flex items-stretch gap-px px-2 py-1">
      {/* Hidden file input — reserved for future local-upload implementation */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden="true"
      />

      <InsertGroup label="Pages">
        {/* Cover, Blank Page, Page Break: no OO SDK connector method — stub pending plugin support */}
        <InsertBtn label="Cover" icon={BookOpen} onClick={() => notAvailable('Cover Page')} />
        <InsertBtn label="Blank Page" icon={FileText} onClick={() => notAvailable('Blank Page')} />
        <InsertBtn label="Page Break" icon={Minus} onClick={() => notAvailable('Page Break')} />
      </InsertGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <InsertGroup label="Tables">
        <InsertBtn label="Table" icon={Table} onClick={handleInsertTable} />
      </InsertGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <InsertGroup label="Illustrations">
        <InsertBtn label="Image" icon={Image} onClick={handleInsertImage} />
      </InsertGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <InsertGroup label="Links">
        {/* Hyperlink: no direct connector method — stub pending OO SDK support */}
        <InsertBtn label="Link" icon={Link} onClick={() => notAvailable('Hyperlink')} />
      </InsertGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <InsertGroup label="Text">
        {/* Header, Footer, Code Block: not exposed via OO SDK connector */}
        <InsertBtn label="Header" icon={Hash} onClick={() => notAvailable('Header')} />
        <InsertBtn label="Footer" icon={Hash} onClick={() => notAvailable('Footer')} />
        <InsertBtn label="Code Block" icon={SquareCode} onClick={() => notAvailable('Code Block')} />
      </InsertGroup>
    </div>
  )
}
