import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { BookOpen, List, Moon, Sun, PanelLeft, Ruler } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'

function ViewBtn({
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

function ViewGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-stretch">
      <div className="flex items-center gap-0.5 px-1">{children}</div>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-0.5 px-1">
        {label}
      </span>
    </div>
  )
}

export function ViewTab() {
  const { isDarkMode, toggleDarkMode, sidebarPanel, toggleSidebarPanel } =
    useEditorStore()

  return (
    <div className="flex items-stretch gap-px px-2 py-1">
      <ViewGroup label="Views">
        <ViewBtn
          label="Print Layout"
          icon={BookOpen}
          onClick={() => console.log('print layout')}
          active
        />
        <ViewBtn
          label="Outline"
          icon={List}
          onClick={() => toggleSidebarPanel('outline')}
          active={sidebarPanel === 'outline'}
        />
      </ViewGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <ViewGroup label="Show">
        <ViewBtn
          label="Ruler"
          icon={Ruler}
          onClick={() => console.log('ruler')}
        />
        <ViewBtn
          label="Side Panel"
          icon={PanelLeft}
          onClick={() => toggleSidebarPanel('outline')}
          active={sidebarPanel === 'outline'}
        />
      </ViewGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      <ViewGroup label="Appearance">
        <ViewBtn
          label={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          icon={isDarkMode ? Sun : Moon}
          onClick={toggleDarkMode}
          active={isDarkMode}
        />
      </ViewGroup>
    </div>
  )
}
