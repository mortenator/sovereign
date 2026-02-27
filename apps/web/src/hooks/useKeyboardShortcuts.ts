import { useEffect, useCallback } from 'react'
import { SHORTCUTS, matchesShortcut } from '@/lib/shortcuts'
import { useEditorStore } from '@/store/editorStore'
import { execFormat } from '@/lib/onlyoffice'

export function useKeyboardShortcuts() {
  const {
    toggleCommandPalette,
    setFindOpen,
    setCommandPaletteOpen,
  } = useEditorStore()

  const handleShortcut = useCallback(
    (action: string) => {
      switch (action) {
        case 'save':
          window.editor?.requestSave()
          break
        case 'saveAs':
          window.editor?.downloadAs('docx')
          break
        case 'print':
          window.editor?.print()
          break
        case 'undo':
          document.execCommand('undo')
          break
        case 'redo':
          document.execCommand('redo')
          break
        case 'find':
          setFindOpen(true)
          break
        case 'replace':
          setFindOpen(true)
          break
        case 'bold':
          execFormat('bold')
          break
        case 'italic':
          execFormat('italic')
          break
        case 'underline':
          execFormat('underline')
          break
        case 'alignLeft':
          execFormat('justifyLeft')
          break
        case 'alignCenter':
          execFormat('justifyCenter')
          break
        case 'alignRight':
          execFormat('justifyRight')
          break
        case 'alignJustify':
          execFormat('justifyFull')
          break
        case 'fontSizeUp':
          // Handled by font size controls
          break
        case 'fontSizeDown':
          // Handled by font size controls
          break
        case 'commandPalette':
          toggleCommandPalette()
          break
        case 'close':
          setCommandPaletteOpen(false)
          setFindOpen(false)
          break
      }
    },
    [toggleCommandPalette, setFindOpen, setCommandPaletteOpen]
  )

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textareas (except for modal shortcuts)
      const target = event.target as HTMLElement
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      for (const shortcut of SHORTCUTS) {
        if (matchesShortcut(event, shortcut)) {
          // Always allow commandPalette and close shortcuts
          if (
            shortcut.action === 'commandPalette' ||
            shortcut.action === 'close'
          ) {
            event.preventDefault()
            handleShortcut(shortcut.action)
            return
          }

          // Skip formatting shortcuts when focused on regular input fields
          if (isInputField) continue

          event.preventDefault()
          handleShortcut(shortcut.action)
          return
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleShortcut])
}
