import { useState } from 'react'
import { Ribbon } from '@/components/Toolbar/Ribbon'
import { EditorShell } from '@/components/Editor/EditorShell'
import { CommandPalette } from '@/components/CommandPalette/CommandPalette'
import { StatusBar } from '@/components/StatusBar/StatusBar'
import { NewDocumentDialog } from '@/components/FileManager/NewDocumentDialog'
import { SaveAsDialog } from '@/components/FileManager/SaveAsDialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useEditorStore } from '@/store/editorStore'
import { useDocumentStore } from '@/store/documentStore'
import {
  FileText,
  Save,
  Download,
  Share2,
  Moon,
  Sun,
  ChevronDown,
  PanelLeft,
  MessageSquare,
  Palette,
  Command,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

function AppHeader() {
  const { isDarkMode, toggleDarkMode, toggleSidebarPanel, sidebarPanel, toggleCommandPalette } =
    useEditorStore()
  const { documentTitle, isDirty } = useDocumentStore()
  const [newDocOpen, setNewDocOpen] = useState(false)
  const [saveAsOpen, setSaveAsOpen] = useState(false)

  return (
    <>
      <header
        className="flex items-center justify-between px-3 py-1.5 bg-blue-700 dark:bg-blue-900 text-white shrink-0"
        role="banner"
      >
        {/* Left: Logo + file actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-700" />
            </div>
            <span className="font-semibold text-sm tracking-wide">Sovereign</span>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNewDocOpen(true)}
              className="text-white hover:bg-blue-600 dark:hover:bg-blue-800 text-xs h-7"
              aria-label="New document"
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.editor?.requestSave()}
              className="text-white hover:bg-blue-600 dark:hover:bg-blue-800 text-xs h-7"
              aria-label="Save document"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Save{isDirty && <span className="ml-1 text-yellow-300">●</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSaveAsOpen(true)}
              className="text-white hover:bg-blue-600 dark:hover:bg-blue-800 text-xs h-7"
              aria-label="Save as / download"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Export
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </Button>
          </div>
        </div>

        {/* Center: Document title (read-only in header) */}
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm font-medium text-white/90 max-w-xs truncate" aria-live="polite">
            {documentTitle}
          </span>
        </div>

        {/* Right: panel toggles + share + dark mode */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleSidebarPanel('outline')}
                className={cn(
                  'text-white hover:bg-blue-600 dark:hover:bg-blue-800 h-7 w-7',
                  sidebarPanel === 'outline' && 'bg-blue-600 dark:bg-blue-800'
                )}
                aria-label="Toggle outline panel"
                aria-pressed={sidebarPanel === 'outline'}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Outline</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleSidebarPanel('styles')}
                className={cn(
                  'text-white hover:bg-blue-600 dark:hover:bg-blue-800 h-7 w-7',
                  sidebarPanel === 'styles' && 'bg-blue-600 dark:bg-blue-800'
                )}
                aria-label="Toggle styles panel"
                aria-pressed={sidebarPanel === 'styles'}
              >
                <Palette className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Styles</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleSidebarPanel('comments')}
                className={cn(
                  'text-white hover:bg-blue-600 dark:hover:bg-blue-800 h-7 w-7',
                  sidebarPanel === 'comments' && 'bg-blue-600 dark:bg-blue-800'
                )}
                aria-label="Toggle comments panel"
                aria-pressed={sidebarPanel === 'comments'}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Comments</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-blue-500 mx-1" aria-hidden="true" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCommandPalette}
                className="text-white hover:bg-blue-600 dark:hover:bg-blue-800 h-7 w-7"
                aria-label="Open command palette (Ctrl+K)"
              >
                <Command className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Command Palette (⌘K)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {}}
                className="text-white hover:bg-blue-600 dark:hover:bg-blue-800 h-7 w-7"
                aria-label="Share document"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="text-white hover:bg-blue-600 dark:hover:bg-blue-800 h-7 w-7"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <NewDocumentDialog open={newDocOpen} onOpenChange={setNewDocOpen} />
      <SaveAsDialog open={saveAsOpen} onOpenChange={setSaveAsOpen} />
    </>
  )
}

export default function App() {
  useDarkMode()
  useKeyboardShortcuts()

  return (
    <TooltipProvider delayDuration={600}>
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
        <AppHeader />
        <Ribbon />
        <EditorShell />
        <StatusBar />
        <CommandPalette />
      </div>
    </TooltipProvider>
  )
}
