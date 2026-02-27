import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MessageSquare, CheckSquare, Eye, GitMerge, SpellCheck } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'

function ReviewBtn({
  label,
  icon: Icon,
  onClick,
  active,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  active?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'ribbon-active' : 'ribbon'}
          size="sm"
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
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

function ReviewGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-stretch">
      <div className="flex items-center gap-0.5 px-1">{children}</div>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-0.5 px-1">
        {label}
      </span>
    </div>
  )
}

export function ReviewTab() {
  const { sidebarPanel, toggleSidebarPanel } = useEditorStore()

  return (
    <div className="flex items-stretch gap-px px-2 py-1">
      <ReviewGroup label="Proofing">
        <ReviewBtn
          label="Spelling"
          icon={SpellCheck}
          onClick={() => console.log('spelling')}
        />
      </ReviewGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <ReviewGroup label="Comments">
        <ReviewBtn
          label="Comments"
          icon={MessageSquare}
          onClick={() => toggleSidebarPanel('comments')}
          active={sidebarPanel === 'comments'}
        />
        <ReviewBtn
          label="Accept All"
          icon={CheckSquare}
          onClick={() => console.log('accept all')}
        />
      </ReviewGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <ReviewGroup label="Tracking">
        <ReviewBtn
          label="Track Changes"
          icon={GitMerge}
          onClick={() => console.log('track changes')}
        />
        <ReviewBtn
          label="Show Markup"
          icon={Eye}
          onClick={() => console.log('show markup')}
        />
      </ReviewGroup>
    </div>
  )
}
