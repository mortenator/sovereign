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

export function InsertTab() {
  const handleInsert = (type: string) => {
    console.log(`Insert: ${type}`)
    // In production, these would call the OO SDK plugin API
  }

  return (
    <div className="flex items-stretch gap-px px-2 py-1">
      <InsertGroup label="Pages">
        <InsertBtn label="Cover" icon={BookOpen} onClick={() => handleInsert('cover')} />
        <InsertBtn label="Blank Page" icon={FileText} onClick={() => handleInsert('blank')} />
        <InsertBtn label="Page Break" icon={Minus} onClick={() => handleInsert('pagebreak')} />
      </InsertGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <InsertGroup label="Tables">
        <InsertBtn label="Table" icon={Table} onClick={() => handleInsert('table')} />
      </InsertGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <InsertGroup label="Illustrations">
        <InsertBtn label="Image" icon={Image} onClick={() => handleInsert('image')} />
      </InsertGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <InsertGroup label="Links">
        <InsertBtn label="Link" icon={Link} onClick={() => handleInsert('link')} />
      </InsertGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <InsertGroup label="Text">
        <InsertBtn label="Header" icon={Hash} onClick={() => handleInsert('header')} />
        <InsertBtn label="Footer" icon={Hash} onClick={() => handleInsert('footer')} />
        <InsertBtn label="Code Block" icon={SquareCode} onClick={() => handleInsert('code')} />
      </InsertGroup>
    </div>
  )
}
