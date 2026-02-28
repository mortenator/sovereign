import { useCallback, useMemo } from 'react'
import { Command } from 'cmdk'
import { useEditorStore } from '@/store/editorStore'
import { useDocumentStore } from '@/store/documentStore'
import { buildCommands } from './commands'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Search } from 'lucide-react'

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    toggleDarkMode,
    toggleSidebarPanel,
    setFindOpen,
    setZoomLevel,
  } = useEditorStore()
  const { newDocument } = useDocumentStore()

  const commands = useMemo(
    () =>
      buildCommands({
        save: () => window.editor?.requestSave(),
        saveAs: () => window.editor?.downloadAs('docx'),
        print: () => window.editor?.print(),
        find: () => {
          setFindOpen(true)
          setCommandPaletteOpen(false)
        },
        toggleDarkMode,
        toggleOutline: () => toggleSidebarPanel('outline'),
        toggleComments: () => toggleSidebarPanel('comments'),
        newDocument,
        setZoom: setZoomLevel,
      }),
    [toggleDarkMode, toggleSidebarPanel, setFindOpen, setCommandPaletteOpen, newDocument, setZoomLevel]
  )

  const runCommand = useCallback(
    (action: () => void) => {
      setCommandPaletteOpen(false)
      // Small delay to let the dialog close first
      setTimeout(action, 50)
    },
    [setCommandPaletteOpen]
  )

  // Group commands by category
  const categories = useMemo(() => {
    const map = new Map<string, typeof commands>()
    for (const cmd of commands) {
      if (!map.has(cmd.category)) map.set(cmd.category, [])
      map.get(cmd.category)!.push(cmd)
    }
    return map
  }, [commands])

  return (
    <DialogPrimitive.Root
      open={isCommandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[20%] z-50 w-full max-w-xl translate-x-[-50%] shadow-2xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-label="Command palette"
        >
          <DialogPrimitive.Title className="sr-only">Command Palette</DialogPrimitive.Title>
          <Command className="flex flex-col" label="Command palette">
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-3">
              <Search className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0 mr-2" />
              <Command.Input
                placeholder="Type a command or search…"
                className="flex-1 h-12 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
              />
            </div>
            <Command.List className="max-h-96 overflow-y-auto overscroll-contain py-2">
              <Command.Empty className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                No commands found.
              </Command.Empty>
              {Array.from(categories.entries()).map(([category, items]) => (
                <Command.Group
                  key={category}
                  heading={category}
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500 dark:[&_[cmdk-group-heading]]:text-gray-400"
                >
                  {items.map((cmd) => (
                    <Command.Item
                      key={cmd.id}
                      value={`${cmd.label} ${cmd.keywords?.join(' ') ?? ''}`}
                      onSelect={() => runCommand(cmd.action)}
                      className="flex items-center justify-between px-3 py-2 mx-1 rounded cursor-pointer text-sm text-gray-800 dark:text-gray-200 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/30 aria-selected:text-blue-700 dark:aria-selected:text-blue-300"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{cmd.label}</span>
                        {cmd.description && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {cmd.description}
                          </span>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
