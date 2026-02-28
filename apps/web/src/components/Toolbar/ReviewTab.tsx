import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MessageSquare, CheckSquare, Eye, GitMerge, SpellCheck } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { execOOMethod } from '@/lib/onlyoffice'

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
  const [trackChanges, setTrackChanges] = useState(false)
  const [showMarkup, setShowMarkup] = useState(false)

  const handleTrackChanges = () => {
    const next = !trackChanges
    setTrackChanges(next)
    execOOMethod('SetRevisionsChange', null, { set: next })
  }

  const handleAcceptAll = () => {
    execOOMethod('AcceptAllRevisions', null)
  }

  const handleShowMarkup = () => {
    const next = !showMarkup
    setShowMarkup(next)
    execOOMethod('ShowChanges', null, { value: next })
  }

  return (
    <div className="flex items-stretch gap-px px-2 py-1">
      <ReviewGroup label="Proofing">
        {/* Spelling check is not exposed via OO SDK connector — use Review menu in the editor */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ribbon"
              size="sm"
              disabled
              aria-label="Spelling — use Review menu in editor"
              className="flex-col h-12 w-14 gap-0.5 text-[10px] opacity-50 cursor-not-allowed"
            >
              <SpellCheck className="h-4 w-4" />
              Spelling
            </Button>
          </TooltipTrigger>
          <TooltipContent>Use Review menu in editor</TooltipContent>
        </Tooltip>
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
          onClick={handleAcceptAll}
        />
      </ReviewGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <ReviewGroup label="Tracking">
        <ReviewBtn
          label="Track Changes"
          icon={GitMerge}
          onClick={handleTrackChanges}
          active={trackChanges}
        />
        <ReviewBtn
          label="Show Markup"
          icon={Eye}
          onClick={handleShowMarkup}
          active={showMarkup}
        />
      </ReviewGroup>
    </div>
  )
}
