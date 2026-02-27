export interface ShortcutDef {
  key: string
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  action: string
  category: string
}

const isMac =
  typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')

export const MOD = isMac ? 'meta' : 'ctrl'

export const SHORTCUTS: ShortcutDef[] = [
  // File
  { key: 's', [MOD]: true, description: 'Save', action: 'save', category: 'File' },
  { key: 's', [MOD]: true, shift: true, description: 'Save As', action: 'saveAs', category: 'File' },
  { key: 'p', [MOD]: true, description: 'Print', action: 'print', category: 'File' },

  // Edit
  { key: 'z', [MOD]: true, description: 'Undo', action: 'undo', category: 'Edit' },
  { key: 'y', [MOD]: true, description: 'Redo', action: 'redo', category: 'Edit' },
  { key: 'f', [MOD]: true, description: 'Find', action: 'find', category: 'Edit' },
  { key: 'h', [MOD]: true, description: 'Find & Replace', action: 'replace', category: 'Edit' },

  // Format
  { key: 'b', [MOD]: true, description: 'Bold', action: 'bold', category: 'Format' },
  { key: 'i', [MOD]: true, description: 'Italic', action: 'italic', category: 'Format' },
  { key: 'u', [MOD]: true, description: 'Underline', action: 'underline', category: 'Format' },
  { key: 'e', [MOD]: true, description: 'Center Align', action: 'alignCenter', category: 'Format' },
  { key: 'l', [MOD]: true, description: 'Left Align', action: 'alignLeft', category: 'Format' },
  { key: 'r', [MOD]: true, description: 'Right Align', action: 'alignRight', category: 'Format' },
  { key: 'j', [MOD]: true, description: 'Justify', action: 'alignJustify', category: 'Format' },
  { key: '.', [MOD]: true, shift: true, description: 'Increase Font Size', action: 'fontSizeUp', category: 'Format' },
  { key: ',', [MOD]: true, shift: true, description: 'Decrease Font Size', action: 'fontSizeDown', category: 'Format' },

  // Styles
  { key: '1', alt: true, description: 'Heading 1', action: 'heading1', category: 'Styles' },
  { key: '2', alt: true, description: 'Heading 2', action: 'heading2', category: 'Styles' },
  { key: '3', alt: true, description: 'Heading 3', action: 'heading3', category: 'Styles' },

  // Navigation
  { key: 'k', [MOD]: true, description: 'Command Palette', action: 'commandPalette', category: 'Navigation' },
  { key: 'Escape', description: 'Close / Cancel', action: 'close', category: 'Navigation' },
] as ShortcutDef[]

export function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutDef): boolean {
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase() && event.key !== shortcut.key) {
    return false
  }
  if (!!shortcut.meta !== event.metaKey) return false
  if (!!shortcut.ctrl !== event.ctrlKey) return false
  if (!!shortcut.shift !== event.shiftKey) return false
  if (!!shortcut.alt !== event.altKey) return false
  return true
}
