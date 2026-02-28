import { useEffect, useCallback } from 'react'
import { SHORTCUTS, matchesShortcut } from '@/lib/shortcuts'
import { useEditorStore } from '@/store/editorStore'
import { execOOMethod } from '@/lib/onlyoffice'

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
          execOOMethod('undo')
          break
        case 'redo':
          execOOMethod('redo')
          break
        case 'find':
          setFindOpen(true)
          break
        case 'replace':
          setFindOpen(true)
          break
        case 'bold':
          execOOMethod('bold')
          break
        case 'italic':
          execOOMethod('italic')
          break
        case 'underline':
          execOOMethod('underline')
          break
        case 'alignLeft':
          execOOMethod('justifyLeft')
          break
        case 'alignCenter':
          execOOMethod('justifyCenter')
          break
        case 'alignRight':
          execOOMethod('justifyRight')
          break
        case 'alignJustify':
          execOOMethod('justifyFull')
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
