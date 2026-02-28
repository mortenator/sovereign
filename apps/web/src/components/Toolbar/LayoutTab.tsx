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
  IndentIcon,
  OutdentIcon,
} from 'lucide-react'
import { execOOMethod } from '@/lib/onlyoffice'

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
  // Page Setup actions: no direct OO SDK connector method — route to editor UI
  const notAvailable = (feature: string) =>
    alert(`"${feature}" is not available via the ribbon.\nUse the Layout menu inside the editor.`)

  const handleIndentDecrease = () => {
    execOOMethod('ParagraphIndent', null, { type: 'decrease' })
  }

  const handleIndentIncrease = () => {
    execOOMethod('ParagraphIndent', null, { type: 'increase' })
  }

  return (
    <div className="flex items-stretch gap-px px-2 py-1">
      <LayoutGroup label="Page Setup">
        {/* Page setup dialogs are not exposed via OO SDK connector — stub pending plugin support */}
        <LayoutBtn label="Margins" icon={Ruler} onClick={() => notAvailable('Margins')} />
        <LayoutBtn label="Orientation" icon={ArrowUpDown} onClick={() => notAvailable('Orientation')} />
        <LayoutBtn label="Size" icon={LayoutTemplate} onClick={() => notAvailable('Size')} />
        <LayoutBtn label="Columns" icon={Columns} onClick={() => notAvailable('Columns')} />
      </LayoutGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <LayoutGroup label="Paragraph">
        <div className="flex items-center gap-1 px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ribbon"
                size="icon"
                onClick={handleIndentDecrease}
                aria-label="Decrease indent"
                className="h-7 w-7"
              >
                <OutdentIcon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Decrease Indent</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ribbon"
                size="icon"
                onClick={handleIndentIncrease}
                aria-label="Increase indent"
                className="h-7 w-7"
              >
                <IndentIcon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Increase Indent</TooltipContent>
          </Tooltip>
        </div>
      </LayoutGroup>
    </div>
  )
}
