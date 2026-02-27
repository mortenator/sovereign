import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutTemplate,
  Columns,
  Ruler,
  ArrowUpDown,
} from 'lucide-react'

function LayoutBtn({
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

function LayoutGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-stretch">
      <div className="flex items-center gap-0.5 px-1">{children}</div>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-0.5 px-1">
        {label}
      </span>
    </div>
  )
}

export function LayoutTab() {
  const handleLayout = (type: string) => {
    console.log(`Layout: ${type}`)
  }

  return (
    <div className="flex items-stretch gap-px px-2 py-1">
      <LayoutGroup label="Page Setup">
        <LayoutBtn label="Margins" icon={Ruler} onClick={() => handleLayout('margins')} />
        <LayoutBtn label="Orientation" icon={ArrowUpDown} onClick={() => handleLayout('orientation')} />
        <LayoutBtn label="Size" icon={LayoutTemplate} onClick={() => handleLayout('size')} />
        <LayoutBtn label="Columns" icon={Columns} onClick={() => handleLayout('columns')} />
      </LayoutGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <LayoutGroup label="Paragraph">
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="w-16">Indent Left</span>
            <input
              type="number"
              defaultValue={0}
              min={0}
              max={100}
              className="w-14 h-6 border border-gray-300 dark:border-gray-600 rounded px-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              aria-label="Left indent in cm"
            />
            <span className="text-[10px] text-gray-400">cm</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="w-16">Indent Right</span>
            <input
              type="number"
              defaultValue={0}
              min={0}
              max={100}
              className="w-14 h-6 border border-gray-300 dark:border-gray-600 rounded px-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              aria-label="Right indent in cm"
            />
            <span className="text-[10px] text-gray-400">cm</span>
          </div>
        </div>
      </LayoutGroup>
    </div>
  )
}
